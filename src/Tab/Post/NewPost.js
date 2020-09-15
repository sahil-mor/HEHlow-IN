import React, { Component } from 'react';
import { View,StyleSheet,Dimensions, TouchableOpacity,Image,KeyboardAvoidingView,Text,Platform,StatusBar } from 'react-native'
import {  Spinner,Label,Item, Textarea, CardItem } from 'native-base';
import {Entypo} from '@expo/vector-icons'
import * as firebase from 'firebase'
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from 'react-native-elements';
import {Ionicons} from '@expo/vector-icons'
import Animated from 'react-native-reanimated'
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import uuid from 'react-native-uuid'
import dateformat from 'dateformat'


const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight
import STYLES from '../../styles/styles'

const {width,height} = Dimensions.get("window")

export class NewPost extends Component {
    constructor(props){
        super(props);
        this.scrollY = new Animated.Value(0)
        this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
        this.headerY = Animated.interpolate(this.diffClampScrollY,{
            inputRange : [0, HEADER_HEIGHT],
            outputRange : [0,-HEADER_HEIGHT]
        })
        this.state = {
            user : null,objectId : null,userId : null,photo : null,caption : "",
            uploading : false,waiting : true,showError : false
        }
    }
    componentDidMount(){
        firebase.auth().onAuthStateChanged(authenticate => {
            if(authenticate){
                this.findUser(authenticate.uid)
            //   if(this.props.route.params.photo){
            //       this.setState({ photo : this.props.route.params.photo })
            //   }
                this.setState({ userId : authenticate.uid})
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
                    this.setState({ user : matchedUser[0],waiting : false })
                }
            }else{
                this.props.navigation.replace("Register")
            }
        })
    }
    getPermissionAsync = async () => {
        if (Constants.platform.ios) {
          const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
          if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
          }
        }
    }
    _pickImage = async () => {
        this.getPermissionAsync();
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 4],
          quality: 1
        });
    
        console.log(result);
        
        if (!result.cancelled) {
          this.setState({ imageUploading : true, photo : result })
        }
    };
      //TODO: upload image to firebase
    uploadImageAsync = async (uri, storageRef) => {
        const parts = uri.split(".");
        const fileExtension = parts[parts.length - 1]
    
        // create blob
        const blob = await new Promise( (resolve , reject) => {
          const xhr = new XMLHttpRequest();
          // .then
          xhr.onload = function(){
            resolve(xhr.response)
          };
          // .catch
          xhr.onerror = function(e){
            console.log(e)
            reject(new TypeError("Network request failed"))
          }
          xhr.responseType = "blob"
          xhr.open("GET",uri,true)
          xhr.send(null)
        } )
    
        // upload part
        const ref = storageRef
        .child("Posts/" + this.state.user.userName + "-" + this.state.objectId)
        .child(uuid.v4() + "." + fileExtension)
        const snapshot = await ref.put(blob)
    
        //closes the blob
        blob.close()
        return await snapshot.ref.getDownloadURL()
    
    };
    returnTime = () => {
        var now = new Date();
        var Dates = dateformat(now, 'mmm d yyyy h:MM:ss TT');
        var time = dateformat(now, 'h:MM TT')
        return {
            time : time, date : Dates
        }
    }
    createPost = async () => {
        this.setState({ showError : false })
        if(!this.state.photo){
            this.setState({ showError : true })
            return
        }
        this.setState({ uploading : true })
        const storageRef = firebase.storage().ref();
        var imageUrl = await this.uploadImageAsync(this.state.photo.uri,storageRef)
        var today = this.returnTime()
        var User = firebase.database().ref("Users/" + this.state.objectId)
        var Posts = firebase.database().ref("Posts")
        var NewPost =  Posts.push({
            imageUrl : imageUrl,uploadedOnDate : today.date,uploadedOnTime : today.time,caption : this.state.caption,
            numComments : 0,numLikes : 0,likes : [],comments : [],ownerUid : this.state.user.uid,ownerObjectId : this.state.objectId
        });
        var currentPosts = this.state.user.posts
        if(currentPosts == undefined){
            currentPosts = []
        }
        var currentPostsNum = this.state.user.numPosts
        currentPostsNum += 1
        var newPost = {
            postObjectId : NewPost.key
        }
        currentPosts.unshift(newPost)
        var timelinePostsUser = this.state.user.timelinePosts
        if(timelinePostsUser == undefined){
            timelinePostsUser = []
        }
        if(timelinePostsUser.length == 50){
            timelinePostsUser = timelinePostsUser.slice(0,40)
        }
        if(timelinePostsUser.filter( eachPost => {
            return eachPost.postObjectId == NewPost.key
        } ).length == 0){
            timelinePostsUser.unshift(newPost)
        }else{
            console.log("post already exist")
        }
        User.on("value",data => {
            if(data.val()){
                var followers = data.val().followers
                followers = followers.slice(1,followers.length)
                followers.forEach( eachOne => {
                    if(eachOne.objectId != undefined){
                        var userFollower = firebase.database().ref("Users/" + eachOne.objectId)
                        var timelinePosts;
                        userFollower.on("value",followerData => {
                            if(followerData.val()){
                                timelinePosts = followerData.val().timelinePosts
                                if(timelinePosts == undefined){
                                    timelinePosts = []
                                }
                                if(timelinePosts.length == 50){
                                    timelinePosts = timelinePosts.slice(0,40)
                                }
                                if(timelinePosts.filter( eachPost => {
                                    return eachPost.postObjectId == NewPost.key
                                } ).length == 0){
                                    timelinePosts.unshift(newPost)
                                }else{
                                    console.log("post already exist")
                                }
                            }
                        })
                        userFollower.update({
                            timelinePosts : timelinePosts
                        })
                        .then( () => {} )
                        .catch(err => {
                            console.log(err);alert(err.message)
                        })
                    }
                })
            }
        })
        User.update({
            posts : currentPosts,numPosts : currentPostsNum,timelinePosts : timelinePostsUser
        })
        .then(()=>{ 
            this.props.navigation.navigate("Profile") 
        })
        .catch(err => {
            console.log(err)
            alert(err.message)
            this.props.navigation.navigate("Profile") 
        })
        this.setState({ uploading : false })
    }
    render() {
        if(this.state.waiting){
            return(
                <View style={styles.container}>
                    <Spinner color="green" />
                </View>
            )
        }
        return (
            <View style={[STYLES.generalPage]} >
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
                        <Animated.View style={{position : "absolute",left : 0 ,marginTop : -30}}>
                            <TouchableOpacity style={{marginLeft : 20}} onPress={() => this.props.navigation.goBack()  }>
                                <Ionicons name="md-arrow-round-back" size={30} color="white" />
                            </TouchableOpacity> 
                        </Animated.View>
                        <Animated.View style={{position : "absolute",left : width * 0.14 ,marginTop : -30}}>
                            <Avatar
                                size={50}
                                rounded
                                source={ this.state.user.userProfile  ? { uri : this.state.user.userProfile } : 
                                require("../../../assets/account.png") }
                            />
                        </Animated.View>
                        <Animated.View style={{position : "absolute",left : width * 0.28,marginTop : -30 }}>
                                <Text style={{color : "white",fontWeight : "bold",fontSize : 25}}> {this.state.user.userName} </Text>
                        </Animated.View>
                        <Animated.View style={{position : "absolute",left : width * 0.82,marginTop : -30 }}>
                            <TouchableOpacity onPress={()=>{this.createPost()}}> 
                                <Text style={{color : "white",fontSize : 20}}>Post</Text>
                            </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
                <Animated.ScrollView
                    bounces={false}
                    style={[{paddingTop : HEADER_HEIGHT-25 },styles.postcontainer]}
                    scrollEventThrottle={16}
                    onScroll={Animated.event([{
                        nativeEvent : { contentOffset : {y : this.scrollY } }
                    }])}
                >
                    {this.state.showError ? 
                        <View style={{flex : 1,width : width,marginTop : -25}} >
                            <View style={{...styles.tabContainer}}>
                                <View style={{
                                    position : "absolute",
                                    height : 70,
                                    justifyContent : "center",
                                    borderRadius : 70
                                }}>
                                    <Text style={{color : "black",fontSize : 20,fontWeight : "bold",left : width *0.2}}> Please Select Image </Text>
                                </View>
                            </View>
                        </View>
                    : null}
                    {this.state.uploading ?
                        <View style={{alignItems : "center"}}>
                            <Spinner style={{marginTop : height*0.3}} color="red" size="large" />
                            <Text style={{color : "white",fontWeight : "bold",fontSize : 18}}>  Post is being uploaded </Text>
                            <Text style={{color : "white",marginTop : 15,fontSize : 13}}> Don't Press Any Button !!! </Text>
                        </View>
                    : 
                    < KeyboardAvoidingView  behavior="padding" >
                            <View style={{maxHeight : 450}}>
                                <Image 
                                    style={styles.imageHolder}
                                    source={
                                        this.state.photo == null ? { uri : this.state.user.userProfile } : this.state.photo
                                    }
                                />
                            </View>
                            <View style={{height : 350}}>
                                <CardItem style={{ backgroundColor : "rgba(8,8,8,0.85)" }}>
                                    <Item  style={{flex : 1}}>
                                        <TouchableOpacity style={{flex : 1,flexDirection : "row"}} onPress={()=>{this._pickImage()}}>
                                            <Label style={STYLES.specialColor}>Select Image</Label>
                                            <Entypo size={30} style={{marginLeft : 40}} color="white" name="folder-images" />
                                        </TouchableOpacity>
                                    </Item>
                                    <Item style={{flex : 1}}>
                                        <TouchableOpacity style={{flex : 1,flexDirection : "row"}} onPress={()=>{
                                            this.props.navigation.navigate("Camera")}}>
                                            <Label style={STYLES.specialColor}> Camera </Label>
                                            <Entypo size={30} style={{marginLeft : 70}} color="white" name="camera" />
                                        </TouchableOpacity>
                                    </Item>
                                </CardItem>
                                <CardItem style={{ backgroundColor : "rgba(8,8,8,0.85)" }}>
                                    <Textarea onChangeText={(caption) => { this.setState({ caption }) }} rowSpan={5} 
                                        style={{width : "100%",color : "white"}} placeholderTextColor="rgba(245,245,245,0.8)" bordered placeholder="Caption" />
                                </CardItem>
                            </View>
                        </KeyboardAvoidingView>
                    }
                </Animated.ScrollView>
            </View> 
        );
  }
}
const styles = StyleSheet.create({
    username : {
        position : "absolute",top : 45,color : "white",left : 50,fontSize : 20
    },
    userProfile : {
        position : "absolute",left : 10,top : 40
    },
    menuIcon : {
        position : "absolute",right : 30,top : 40,color : "white",fontSize : 20
    },
    imageHolder : {
        alignSelf : "center",margin : 20,height : "100%",width : "100%"
    },
    tabContainer : {
        height : 70,
        flexDirection : "row",
        marginTop : 40,
        width : width - 30,
        marginHorizontal : 15,
        backgroundColor : "lightgrey",
        borderRadius : 70,
        overflow : "hidden",
        zIndex : 10
    },
})