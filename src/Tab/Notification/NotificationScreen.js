import React from 'react';
import { StyleSheet, Text, View,Dimensions,Platform,StatusBar,Image,TouchableOpacity} from 'react-native';
import {Badge,Thumbnail,List,ListItem,Body,Spinner } from 'native-base'
import * as firebase from 'firebase'
import { Avatar } from 'react-native-elements';
import Animated from 'react-native-reanimated'
import dateformat from 'dateformat'
import * as Font from 'expo-font'
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';

const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight
const {width} = Dimensions.get("window")
import STYLES from '../../styles/styles'
import config from "../config"

export class NotificationScreen extends React.Component{
    constructor(props){
        super(props);
        this.scrollY = new Animated.Value(0)
        this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
        this.headerY = Animated.interpolate(this.diffClampScrollY,{
            inputRange : [0, HEADER_HEIGHT],
            outputRange : [0,-HEADER_HEIGHT]
        })
        this.state = {
          email : "",name : "",user : null,userId : null,showFollowRequest : false,fontLoaded : false,
          todayNotifications : [],otherNotifications : [],waiting : true,onceCalled : false
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
        this.setState({ userId : uid  })
    }
    componentDidMount(){
        firebase.auth().onAuthStateChanged(authenticate => {
            if(authenticate){
                this.callFunction(authenticate.uid,false)
            }else{
                this.props.navigation.replace("Signin")
            }
        })
    }
    findObjectId = async (uid) => {
        var users = firebase.database().ref("Users")
        await users.on("value",(data) => {
            if(data.val()){
              var keys = []
              var index = 0;var matchedIndex;
              data.forEach( D => {
                keys[index] = D.key
                index++;
              } )
              index = 0;
              var Users = Object.values(data.val())
              var matchedUser = Users.filter(u => {
              if(uid === u.uid){
                  matchedIndex = index
              }
              index++;
              return uid === u.uid
              })
              this.setNewNotificationsToAllNotifications(keys[matchedIndex])
              this.setState({ objectId : keys[matchedIndex] })
            }
          })
    }
    findUser = uid => {
        this.findObjectId(uid)
        var users = firebase.database().ref("Users")
        users.on("value",data => {
        if(data.val()){
            var Users = Object.values(data.val())
            var matchedUser = Users.filter(u => {
              return uid == u.uid
            })
            if(matchedUser.length == 1){
              var profileImages = matchedUser[0].profileImages ? matchedUser[0].profileImages : []
              var posts = matchedUser[0].posts ? matchedUser[0].posts : []
              var taggedPost = matchedUser[0].taggedPosts ? matchedUser[0].taggedPost : []
              posts.unshift("firstOne")
              taggedPost.unshift("firstOne")
              this.setState({ user : matchedUser[0], profileImages,posts,taggedPost,showImages : posts,allDone : true,waiting : false,updating : false })
            }
        }else{
            this.props.navigation.replace("Signup")
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
    setNewNotificationsToAllNotifications = async (objectId) => {
          var User = firebase.database().ref("Users/" + objectId)
          var allNotifications,numNewNotifications,newNotifications;
          var today = this.returnTime()
          var date = today.date.slice(0,11)
          await User.on("value",data => {
            if(data.val()){
              allNotifications = data.val().allNotifications
              numNewNotifications = data.val().numNewNotifications
              if(allNotifications == undefined){
                allNotifications = []
              }
              if(allNotifications.length == 40){
                  allNotifications = allNotifications.slice(0,allNotifications.length-10)
              }
              if(data.val().newNotifications != undefined){
                newNotifications = data.val().newNotifications
                var newList = []
                newNotifications.forEach(notification => {
                  if(notification.uploadedDate.slice(0,11) != date){
                    allNotifications.unshift(notification)
                    numNewNotifications = 0
                  }else{
                    newList.push(notification)
                  }
                })
                newNotifications = newList
              }else{
                return
              }
            }
          })
          if(newNotifications == undefined){
            newNotifications = []
          }
          User.update({ 
            numNewNotifications : numNewNotifications,allNotifications : allNotifications,newNotifications : newNotifications
          })
          .then(()=>{ 
            this.setState({ todayNotifications : newNotifications,otherNotifications : allNotifications })
          })
          .catch(err => {
            console.log(err)
            alert(err.message)
          })  
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
                        return "1 m"
                    }else{
                        return ( (currentMinute-uploadedMinute) + " m")
                    }
                }else{
                    var index1 = currentHour.indexOf(" ")
                    var index2 = uploadedHour.indexOf(" ")
                    var time1 = currentHour.slice(index1+1,currentHour.length)
                    var time2 = uploadedHour.slice(index2+1,uploadedHour.length)
                    if(time1 != time2){
                        return ( Math.abs((currentHour.slice(0,index1) - uploadedHour.slice(0,index2) )) + 12 + " h" )
                    }else{
                      var h1 = currentHour.slice(0,index1); var h2 = uploadedHour.slice(0,index2);
                        if(h2 == 12){
                          h2 = 0
                        }
                        var ans = Math.abs( h1- h2 )
                        return ( ans + " h" )
                    }
                }
            }else{
                if( currentDate - uploadedDate <= 3){
                    if(currentDate - uploadedDate == 1){
                        return "1 d"
                    }
                    return ( ( currentDate - uploadedDate ) + " d" )    
                }else{
                    return ( uploadedOnDate.slice(0,11)  )
                }
            }
        }else{
            return ( uploadedOnDate.slice(0,11) )
        }
    }
    showFollowRequests = (currentStatus) => {
        this.setState({ showFollowRequest : !(currentStatus) })
    }
    onSwipe(gestureName, gestureState) {
        const {SWIPE_UP, SWIPE_DOWN, SWIPE_LEFT, SWIPE_RIGHT} = swipeDirections;
        this.setState({gestureName: gestureName});
        switch (gestureName) {
            case SWIPE_UP:
            break;
            case SWIPE_DOWN:
                this.callFunction(this.state.userId,true)
            break;
            case SWIPE_LEFT:
            break;
            case SWIPE_RIGHT:
                this.props.navigation.goBack()
            break;
        }
    }
    render(){
        if(this.state.waiting || !this.state.fontLoaded){
            return(
                <View style={[STYLES.generalPage,{ justifyContent : "center",alignItems : "center",flex : 1 }]}>
                    <Spinner color="red" size="large" />
                </View>
            )
        }
        return(
            <View style={STYLES.generalPage}>
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
                        height : HEADER_HEIGHT,
                        zIndex : 1000,
                        elevation : 1000,
                        alignItems : "center",justifyContent : "center",
                        paddingTop : StatusBar.currentHeight,
                        flexDirection : "column"
                    }} >
                        <Animated.View style={{backgroundColor : "white",height : 30,  position : "absolute",
                            left : 0,
                            right : 0,
                            top : 0,}} 
                        />
                        <Animated.View style={{position : "absolute",
                            left : 0,
                            right : 0,
                            top : 30,
                            height : HEADER_HEIGHT-30,
                            backgroundColor : '#362c2b',
                            width : "100%",
                            zIndex : 1000,
                            elevation : 1000,
                            transform: [ { translateY : this.headerY }],
                            alignItems : "center",justifyContent : "center",
                            paddingTop : StatusBar.currentHeight,
                            flexDirection : "row"}}
                        >
                            <Animated.View style={{position : "absolute",left : width * 0.07,  marginTop : -30}}>
                                <Avatar
                                    size={50}
                                    rounded
                                    source={ this.state.user.userProfile ? { uri : this.state.user.userProfile } : 
                                    require("../../../assets/account.png") }
                                />
                            </Animated.View>
                            <Animated.View style={{position : "absolute",left : width * 0.25, flexDirection : "row",justifyContent : "center",alignItems : "center",marginTop : -25}}>
                                <Text style={{color : "white",fontSize : 22,fontWeight : "bold"}}> Notifications </Text>  
                            </Animated.View>
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
                    ])}>
                        {this.state.updating  ? 
                            <View style={STYLES.updating}>
                                <Text style={{fontWeight : "bold",fontSize : 18}}>UPDATING </Text>
                                <Spinner style={{marginLeft : 10}} color="green" size="small" />
                            </View>
                        :  <View />
                        }
                        {this.state.user.receivedRequests != undefined ?
                            <View>
                                <ListItem>
                                    <TouchableOpacity onPress={()=>{this.showFollowRequests(this.state.showFollowRequest)}} style={{flexDirection : "row"}}>
                                        <Avatar
                                            size={45}
                                            rounded
                                            source={ this.state.user.receivedRequests[0].userProfile ? { uri : this.state.user.receivedRequests[0].userProfile } : 
                                            require("../../../assets/account.png") }
                                        /> 
                                        <Badge style={{position : "absolute",left : 40,top : -10,backgroundColor : "red"}}> 
                                            <Text style={{color : "white"}}> {this.state.user.receivedRequests.length} </Text>
                                        </Badge>
                                        <View style={{marginLeft : "10%"}}>
                                            <Text style={{fontSize : 20,marginTop : "10%",color : "white"}}>Follow Requests</Text>
                                        </View>
                                    </TouchableOpacity>
                                </ListItem>
                                <View style={styles.requests}>
                                    {this.state.showFollowRequest ? 
                                        <View>
                                            {this.state.user.receivedRequests.map( (item,index) => (
                                                <ListItem onPress={() => {this.props.navigation.navigate("SeeOtherAccount",{ params : {
                                                    uid : item.userUid
                                                } })} } key={index}>
                                                    <Thumbnail small source={{ uri : item.userProfile }} />
                                                    <Body>
                                                        <Text style={{ fontSize : 18,fontWeight : "bold",marginTop : "0%",marginLeft : 20,color : "white"}}>
                                                            {item.userName} 
                                                        </Text>
                                                    </Body>
                                                </ListItem>
                                            ) ) }
                                        </View>
                                    : <View />  }
                                </View>
                            </View>
                        : <View />}
                    <List>
                        <ListItem>
                            <Text style={{fontSize : 17,color : "white",marginTop : 10}}>New</Text>
                        </ListItem>
                        {this.state.todayNotifications.map( (item,index) => (
                            <ListItem key={index}>
                                <Thumbnail small source={{ uri : item.image }} />
                                <Body>
                                    <Text style={{fontSize : 15,marginTop : "0%",color : "white"}}> {item.text} </Text>
                                </Body>
                                <Text note style={{color : "white"}} numberOfLines={1}> {this.whatToWrite(item.uploadedDate,item.uploadedTime)} </Text>
                            </ListItem>
                        ) )}
                    </List>
                    <List>
                        <ListItem>
                            <Text style={{fontSize : 17,color : "white",marginTop : 10}}>Notifications</Text>
                        </ListItem>
                        {this.state.otherNotifications.map( (item,index) => (
                            <ListItem key={index} style={ index == this.state.otherNotifications.length - 1 ? {marginBottom : 100} : {} }>
                                <Thumbnail small source={{ uri : item.image }} />
                                <Body>
                                    <Text style={{fontSize : 15,marginTop : "0%",color : "white",marginLeft : 10}}>{item.text}</Text>
                                </Body>
                                <Text note style={{color : "white"}} numberOfLines={1}> ({this.whatToWrite(item.uploadedDate,item.uploadedTime)}) </Text>
                            </ListItem>
                        ) )}
                    </List>
                </Animated.ScrollView>
                </GestureRecognizer>
            </View>
        )
    }
}

const styles = StyleSheet.create({

})