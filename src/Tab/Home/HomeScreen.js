import React from 'react';
import { StyleSheet, Text, View,TextInput,Dimensions,Platform,StatusBar,Image,TouchableOpacity,TouchableWithoutFeedback } from 'react-native';
import { Avatar } from 'react-native-elements';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import {FontAwesome} from '@expo/vector-icons'
import Animated from 'react-native-reanimated'
import dateformat from 'dateformat'
import * as firebase from 'firebase'
import {Spinner} from 'native-base'
import * as Font from 'expo-font'
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';

const {width} = Dimensions.get("window")
const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight

import config from "../config"
import STYLES from '../../styles/styles'

export class HomeScreen extends React.Component{
  constructor(props){
    super(props);
    this.scrollY = new Animated.Value(0)
    this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
    this.headerY = Animated.interpolate(this.diffClampScrollY,{
      inputRange : [0, HEADER_HEIGHT],
      outputRange : [0,-HEADER_HEIGHT]
    })
    this.state = {
      email : "",name : "",user : null,userId : null,objectId : "",updating : false,
      timelinePosts : null,waiting : true,search : "",foundUsers : [],search : "",fontLoaded : false
    }
  }
  loadFonts = async() => {
    await Font.loadAsync({
      'Caveat' : require("../../../assets/fonts/Caveat-Regular.ttf"),
    })
    this.setState({ fontLoaded : true })
  }
  callFunction = (uid,toUpdate) => {
    if(toUpdate){
      this.setState({ updating : true })
    }
    this.loadFonts()
    this.findUser(uid)
  }
  componentDidMount(){
      firebase.auth().onAuthStateChanged(authenticate => {
        if(authenticate){
          this.callFunction(authenticate.uid,false)
          this.setState({ name : authenticate.displayName,email : authenticate.email,
            userId : authenticate.uid})
        }else{
          this.props.navigation.replace("Signin")
        }
      })
  }
  findUser = uid => {
    var users = firebase.database().ref("Users")
    users.on("value",data => {
      if(data.val()){
        var matchedIndex;
        var index = 0;
        var keys= []
        data.forEach(D => {
          keys[index] = D.key
          index++;
        })
        index = 0;
        var Users = Object.values(data.val())
        var matchedUser = Users.filter(u => {
          if(uid === u.uid){
            matchedIndex = index
          }
          index++;
          return uid === u.uid
        })
        if(matchedUser.length == 1){
          this.findTimeLine(keys[matchedIndex])
          this.setState({ user : matchedUser[0], objectId : keys[matchedIndex],waiting : false  ,updating : false})
        }
      }else{
        this.props.navigation.replace("Signin")
      }
    })
  }
  findTimeLine = async objectId => {
    var User = firebase.database().ref("Users/" + objectId)
    await User.on("value",data => {
      if(data.val()){
        var timelinePosts = data.val().timelinePosts
        var TimeLinePosts = []
        if(timelinePosts == undefined){
          timelinePosts = []
        }
        timelinePosts.forEach( eachPost => {
          if(eachPost.postObjectId != undefined){
            var newPost = eachPost
            var post = firebase.database().ref("Posts/" + eachPost.postObjectId)
            post.on("value",postData => {
              if(postData.val()){
                if( postData.val().ownerObjectId != undefined ){
                  newPost.postData = postData.val()
                  var owner = firebase.database().ref("Users/" + postData.val().ownerObjectId)
                  owner.on("value",ownerData => {
                    if(ownerData.val()){
                      newPost.ownerData = ownerData.val()
                      TimeLinePosts.push(newPost)
                    }
                  })
                }
              }
            })
          }
        } )
        this.setState({ timelinePosts : TimeLinePosts })
      }
    })
  }
  returnTime = () => {
    var now = new Date();
    var Dates = dateformat(now, 'mmm d yyyy h:MM:ss TT');
    var time = dateformat(now, 'h:MM TT')
    return {
      time : time, date : Dates
    }
  }
  whatToWrite = (uploadedOnDate,uploadedOnTime) => {
    var currentTime = this.returnTime()
    var currentMonth = currentTime.date.slice(0,3)
    var uploadedOnMonth = uploadedOnDate.slice(0,3)
    if(uploadedOnMonth == currentMonth ){
        var uploadedDate = uploadedOnDate.slice(4,6)
        var currentDate = currentTime.date.slice(4,6)
        if(uploadedDate == currentDate){
            var index1 = uploadedOnTime.indexOf(":")
            var index2 = currentTime.time.indexOf(":")
            var uploadedHour = uploadedOnTime.slice(0,index1) + " " + uploadedOnTime.slice(uploadedOnTime.length-2,uploadedOnTime.length)
            var currentHour = currentTime.time.slice(0,index2) + " " + currentTime.time.slice(currentTime.time.length-2,currentTime.time.length)
            if(uploadedHour == currentHour){
                var uploadedMinute = uploadedOnTime.slice(index1+1,index1+3)
                var currentMinute = currentTime.time.slice(index2+1,index2+3)
                if(uploadedMinute == currentMinute){
                    return "1m ago"
                }else{
                    return ( (currentMinute-uploadedMinute) + "m ago")
                }
            }else{
                var index1 = currentHour.indexOf(" ")
                var index2 = uploadedHour.indexOf(" ")
                var time1 = currentHour.slice(index1+1,currentHour.length)
                var time2 = uploadedHour.slice(index2+1,uploadedHour.length)
                if(time1 != time2){
                    return ( Math.abs((currentHour.slice(0,index1) - uploadedHour.slice(0,index2) )) + 12 + " h ago" )
                }else{
                  var h1 = currentHour.slice(0,index1); var h2 = uploadedHour.slice(0,index2);
                    if(h2 == 12){
                      h2 = 0
                    }
                    var ans = Math.abs( h1- h2 )
                    return ( ans + " h ago" )
                }
            }
        }else{
            if( currentDate - uploadedDate <= 3){
                if(currentDate - uploadedDate == 1){
                    return "1d ago"
                }
                return ( ( currentDate - uploadedDate ) + "d ago" )    
            }else{
                return ( uploadedOnDate.slice(0,11)  )
            }
        }
    }else{
        return ( uploadedOnDate.slice(0,11) )
    }
  }
  likeImage = async (postObjectId,ownerObjectId) => {
    this.setState({ waiting : true })
    var User = await firebase.database().ref("Users/" + ownerObjectId);
    var newNotifications;
    User.on("value",data => {
        if(data.val()){       
            var currentPost;
            var ownerName = data.val().name;
            var Post = firebase.database().ref("Posts/" + postObjectId)
            Post.on("value",data => {
                if(data.val()){
                    currentPost = data.val()
                }
            })
            var currentLikedBy = currentPost.likes
            if(currentLikedBy == undefined){
                currentLikedBy = []
            }
            if( currentLikedBy.filter( eachOne => {
                return eachOne.uid == this.state.user.uid
            } ).length != 0 ){
                return
            }else{   
                var currentLikes = currentPost.numLikes
                currentLikes += 1;
                if(currentLikedBy == undefined){
                    currentLikedBy = []
                }
                var newLikedBy = {
                    uid : this.state.user.uid,objectId : this.state.objectId
                }
                currentLikedBy.unshift(newLikedBy)
                var postLikeStatus = ""
                if(currentLikedBy.filter( eachLike => {
                    return eachLike.uid == currentPost.ownerUid
                } ).length != 0 ){
                    postLikeStatus = "Liked by " + ownerName + " and " + (currentLikes - 1) + " other." 
                }else{
                    postLikeStatus = "Liked by " + this.state.user.name + " and " + (currentLikes - 1) + " other."
                }
                Post.update({
                    numLikes : currentLikes, likes : currentLikedBy,likeStatus : postLikeStatus
                })
                .then(()=>{   })
                .catch(err => {
                    console.log(err)
                    alert(err.message)
                })
                var today = this.returnTime()
                newNotifications = data.val().newNotifications
                if(newNotifications == undefined){
                    newNotifications = []
                }
                var ImageIndex= 0 , requiredImageIndex;
                var requiredNotification = newNotifications.filter( everyNotification => {
                    if(everyNotification.image == currentPost.imageUrl &&
                        everyNotification.text.includes("liked your post.")    
                    ){
                        requiredImageIndex = ImageIndex
                    }
                    ImageIndex += 1;
                    return (everyNotification.image == currentPost.imageUrl &&
                        everyNotification.text.includes("liked your post.")  )
                } )
                if(requiredNotification.length != 0){
                    var newList = newNotifications.slice(0,requiredImageIndex)
                    newList = newList.concat(newNotifications.slice(requiredImageIndex+1,newNotifications.length))
                    var newOne = {
                        image : currentPost.imageUrl,
                        objectId : this.state.objectId,
                        text : this.state.user.userName + " and " + (currentLikes - 1)  + " other liked your post.",
                        uploadedDate : today.date,
                        uploadedTime : today.time
                    }
                    newList.unshift(newOne)
                    newList = newList.slice(0,20)
                    newNotifications = newList
                }else{
                    var newOne = {
                        image : currentPost.imageUrl,
                        objectId : this.state.objectId,
                        text : this.state.user.userName + " liked your post.",
                        uploadedDate : today.date,
                        uploadedTime : today.time
                    }
                    newNotifications.unshift(newOne)
                }
            }
        }
    })
    User.update({
        newNotifications : newNotifications
    })
    .then(()=>{})
    .catch(err => { 
        console.log(err)
        alert(err.message)
    })
    this.setState({ waiting : false })
  }
  unlikeImage = async (postObjectId) => {
    this.setState({ waiting : true })
    var Post = await firebase.database().ref("Posts/" + postObjectId)
    var currentPost;
    Post.on("value",data => {
        if(data.val()){
            currentPost = data.val()
        }
    })
    var currentLikedBy = currentPost.likes
    var requiredIndex = 0;var index = 0;
    if(currentLikedBy != undefined){    
        currentLikedBy.forEach(item => {
            if(item.uid === this.state.user.uid){
                requiredIndex = index
            }
            index++;
            return item.uid === this.state.user.uid
        })
        var currentLikes = currentPost.numLikes
        currentLikes -= 1;
        if(requiredIndex != -1){
            var NewLikes = currentLikedBy.slice(0,requiredIndex)
            NewLikes = NewLikes.concat(currentLikedBy.slice(requiredIndex+1,currentLikedBy.length))
            currentLikedBy = NewLikes
        }
        var postLikeStatus = "Liked by " + currentLikes + ".";
        Post.update({
            numLikes : currentLikes, likes : currentLikedBy,likeStatus : postLikeStatus
        })
        .then(()=>{  })
        .catch(err => {
            console.log(err)
            alert(err.message)
        })
    }
    this.setState({ waiting : false })
  }
  search = Search => {
    if(Search != ""){
      this.props.navigation.navigate("Search",{ params : { searchName : Search }} )
    }else{
      
    }
  }
  sendToMsgScreen = () => {
    this.props.navigation.push("Message",{
      params : { objectId : this.state.objectId }
    })
  }
 
  onSwipe(gestureName, gestureState) {
    const {SWIPE_UP, SWIPE_DOWN, SWIPE_LEFT, SWIPE_RIGHT} = swipeDirections;
    this.setState({gestureName: gestureName});
    switch (gestureName) {
      case SWIPE_UP:
        // this.setState({backgroundColor: 'red'});
        break;
      case SWIPE_DOWN:
        this.callFunction(this.state.userId,true)
        break;
      case SWIPE_LEFT:
        // this.setState({backgroundColor: 'blue'});
        this.sendToMsgScreen()
        break;
      case SWIPE_RIGHT:
        // this.setState({backgroundColor: 'yellow'});
        break;
    }
  }
  render(){
    if(this.state.waiting || !this.state.fontLoaded){
      return( 
        <View style={[STYLES.generalPage,{justifyContent : "center",alignItems : "center"}]}>
          <Spinner size={"large"} color="red"  />
       </View>
      )
    }
    return (
    <View style={[STYLES.generalPage,{ transform : [{
      translateX : [100,-100]
    }] }]}>
      <GestureRecognizer
        onSwipe={(direction, state) => this.onSwipe(direction, state)}
        config={config}
        style={{
          flex: 1,
        }}
        >
      <Animated.View style={{
            position : "absolute",
            left : 0,
            right : 0,
            top : 0,
            height : HEADER_HEIGHT-StatusBar.currentHeight,
            backgroundColor : '#362c2b',
            width : "100%",
            zIndex : 1000,
            elevation : 1000,
            transform: [ { translateY : this.headerY }],
            alignItems : "center",justifyContent : "center",
            paddingTop : StatusBar.currentHeight,
            flexDirection : "row"}}
        >
            <Animated.View style={{flex : 1,marginLeft : 20,marginTop : -30}}>
              <Avatar
                size={50}
                rounded
                source={ this.state.user.userProfile ? { uri : this.state.user.userProfile } : 
                require("../../../assets/account.png") }
              />
            </Animated.View>
            <Animated.View style={{flex : 5,flexDirection : "row",justifyContent : "center",alignItems : "center",marginTop : -25}}>
              <TextInput 
                  placeholder="SEARCH"
                  style={[STYLES.textInput,{flex : 2,fontFamily : "Caveat"}]}
                  placeholderTextColor="black" 
                  value={this.state.search} onChangeText={ search => { this.setState({ search }) } }
              />
              <FontAwesome style={{marginRight : 20}} onPress={() => {this.search(this.state.search)} } name="search" size={30} color="white" />
            </Animated.View>
            <Animated.View style={{flex : 1,alignItems : "flex-end",marginRight : 25,marginTop : -25}}>
              <TouchableOpacity onPress={() => {this.sendToMsgScreen()} }>
                <FontAwesome name="send-o" size={30} color="white"  />
              </TouchableOpacity> 
            </Animated.View>
        </Animated.View>
      <Animated.ScrollView
        bounces={false}
        style={[{paddingTop : HEADER_HEIGHT },styles.postcontainer]}
        scrollEventThrottle={16}
        onScroll={Animated.event([
          {
            nativeEvent : { contentOffset : {y : this.scrollY } }
          }
        ])}
      >
        {this.state.updating  ? 
          <View style={STYLES.updating}>
            <Text style={{fontWeight : "bold",fontSize : 18}}>UPDATING </Text>
            <Spinner style={{marginLeft : 10}} color="green" size="small" />
          </View>
        : null}
        {this.state.timelinePosts.map( (item,index) => (
         <View key={index} style={[styles.eachPost, index == 0 ? {marginTop : 0} : null ]}>
          <View style={{marginHorizontal:8,flexDirection:'row',marginTop:5}}>
              <Avatar
                size={40}
                rounded
                source={{
                  uri:item.ownerData.userProfile,
                }}
              />
              <TouchableOpacity onPress={() => { this.props.navigation.navigate("SeeOtherAccount",{ params :{ uid : item.ownerData.uid} }) } }>
                <Text style={[styles.postownername,{ fontFamily : "Caveat" }]}> {item.ownerData.userName}</Text>
              </TouchableOpacity>
          </View>
          <TouchableWithoutFeedback
            onPress={() => { 
              this.props.navigation.navigate("ShowPost",{
                picData : item.postData, user : this.state.user,objectId : this.state.objectId,
                postObjectId : item.postObjectId,
                ownerUid : item.postData.ownerUid,ownerObjectId : item.postData.ownerObjectId,index : index
              })
            } }
          >
            <Image 
              style={styles.post}
              source={{uri:item.postData.imageUrl}}
            />
          </TouchableWithoutFeedback>
          <View style={{flexDirection:'row'}}>
              <View>
                <TouchableOpacity style={styles.likebutton}>
                  <View >
                  {( item.postData.likes && item.postData.likes.filter( eachLike => {
                      return eachLike.uid == this.state.user.uid
                    } ).length != 0 )  ?
                      <TouchableOpacity onPress={()=>{ this.unlikeImage(item.postObjectId) }}>
                        <Avatar
                          size={27}
                          rounded
                          source={ require("../../../assets/pumpkin.jpg") }
                        />
                      </TouchableOpacity> : 
                      <MaterialCommunityIcons onPress={()=>{ this.likeImage(item.postObjectId,item.postData.ownerObjectId) }} name="heart-outline" color={'rgba(245,245,245,0.6)'} size={27} /> 
                  }
                    </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.likebutton}>
                <View >
                  <MaterialCommunityIcons name="comment-outline" color={'rgba(245,245,245,0.6)'} size={27} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.likebutton}>
                <View >
                  <MaterialCommunityIcons name="share-outline" color={'rgba(245,245,245,0.6)'} size={27} />
                </View>
              </TouchableOpacity>
          </View>
          <View style={{flexDirection : "row"}}>
            <TouchableOpacity 
              onPress={()=>{
                this.props.navigation.navigate("LikedBy",{
                    data : item.postData ,objectId : this.state.objectId,likedBy : item.postData.likes,
                    user : this.state.user,ownerData : item.ownerData
                  })
                }}
              style={[styles.likebutton,{flex : 1}]}>
                <View >
                  <Text style={[styles.liketext,{ fontFamily : "Caveat" }]}> {item.postData.numLikes} Likes</Text>
                </View>
              </TouchableOpacity>
              <View style={{flex : 1}} />
              <Text style={{color : "rgba(245,245,245,0.6)",marginLeft : 5,marginTop : 5,flex : 1 }}>{this.whatToWrite(item.postData.uploadedOnDate,item.postData.uploadedOnTime)}</Text>
          </View>
          <View style={{flex : 1}}>
            <Text style={[styles.liketext,{ marginLeft : 10, }]}>{item.postData.caption}</Text>
          </View>
          <TextInput
            style={[styles.commentbox]}
            placeholder="Add a comment.."
          /> 
      </View>
           ) )}
      </Animated.ScrollView>  
      </GestureRecognizer>
    </View>
  );
}
}
const styles = StyleSheet.create({
  header : {
    flexDirection : "row",marginTop : 20,backgroundColor : "red",borderColor : "white",borderWidth : 2,height : 70
  },
  eachPost : {
    marginBottom : 100,
    marginTop : -80,
  },
  post:{
    height:360,
    width: width ,
    marginVertical:10
  },
  likebutton:{
    marginHorizontal:10,
  },
  liketext:{
    color:'rgba(245,245,245,0.6)',
    fontWeight:'bold',
    marginVertical:5,
  },
  postownername:{
    color:'rgba(245,245,245,0.75)',
    marginVertical:2,
    marginLeft:13,
    fontSize:18,
    fontWeight:'bold',
    marginVertical:8
  },
    postcontainer:{
      borderTopWidth:0.17,
      borderBottomWidth:0.17,
      borderColor:'rgba(245,245,245,0.15)',
      marginTop : 0,
    },
    commentbox:{
      height: 40,
      marginLeft : 5,
      color:"rgba(245,245,245,0.6)"
    },
  },
);
