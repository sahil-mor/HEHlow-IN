import React, {useRef} from 'react';
import { StyleSheet,Image, Text, View,ActivityIndicator,TouchableOpacity,Alert,StatusBar,
   Dimensions,Platform } from 'react-native';
import { Button,Spinner} from 'native-base'
import * as firebase from 'firebase'
import {TapGestureHandler,State} from 'react-native-gesture-handler'
import Animated,{Easing,Transition,Transitioning } from 'react-native-reanimated'
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';
import dateformat from 'dateformat'
import {Entypo} from '@expo/vector-icons'
const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight
import { Avatar } from 'react-native-elements';
const {width,height} = Dimensions.get("screen")
const {Value,event,block,cond,eq,set,Clock,startClock,stopClock,
debug,timing,clockRunning,interpolate,Extrapolate,concat} = Animated

import STYLES from '../../styles/styles'
import config from "../config"
import Tab from '../Profile/imagesGrid/Tab'

function runTiming(clock, value, dest) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration: 1000,
    toValue: new Value(0),
    easing: Easing.inOut(Easing.ease)
  };

  return block([
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.frameTime, 0),
      set(config.toValue, dest),
      startClock(clock)
    ]),
    timing(clock, state, config),
    cond(state.finished, debug('stop clock', stopClock(clock))),
    state.position
  ]);
}

export class SeeOtherAccount extends React.Component {
  constructor(props){
    super(props);
    this.ref = React.createRef();
    this.scrollY = new Animated.Value(0)
    this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
    this.headerY = Animated.interpolate(this.diffClampScrollY,{
      inputRange : [0, HEADER_HEIGHT],
      outputRange : [0,-HEADER_HEIGHT]
    })
    this.buttonOpacity = new Value(1)
    this.backgroundOpacity = new Value(1)
    
    this.buttonY = interpolate(this.buttonOpacity,{
        inputRange:[0,1],
        outputRange : [-100,0],
        extrapolate : Extrapolate.CLAMP
    })

    this.textInputZindex = interpolate(this.buttonOpacity,{
        inputRange:[0,1],
        outputRange : [1,-1],
        extrapolate : Extrapolate.CLAMP
    })

    this.textInputY = interpolate(this.buttonOpacity,{
        inputRange:[0,1],
        outputRange : [0,100],
        extrapolate : Extrapolate.CLAMP
    })

    this.textInputOpacity = interpolate(this.buttonOpacity,{
        inputRange:[0,1],
        outputRange : [1,0],
        extrapolate : Extrapolate.CLAMP
    })

    this.rotateCross = interpolate(this.buttonOpacity,{
        inputRange:[0,1],
        outputRange : [180,360],
        extrapolate : Extrapolate.CLAMP
    })

    this.onStateChange = event([
        {
            nativeEvent : ({state}) => block ([
                cond(eq(state,State.END), set(this.buttonOpacity,runTiming(new Clock(),1,0)),
                 ),
                 cond(eq(state,State.END), set(this.backgroundOpacity,runTiming(new Clock(),1,0.3)),
                 )
            ])
        }
    ])
    this.onCloseState = event([
      {
          nativeEvent : ({state}) => block ([
              cond(eq(state,State.END), set(this.buttonOpacity,runTiming(new Clock(),0,1)) ),
              cond(eq(state,State.END), set(this.backgroundOpacity,runTiming(new Clock(),0.3,1)),
              )
          ])
      }
    ])
    this.state = {
      user : null,userId : null,calledOnce : false,foundUser : null,foundUserId : null,objectIdUser : null,objectIdOther : null
      , relation : "Follow",pictureIcon : true,tagIcon : false,sentDataRequestData : [],updating : false,waiting : true,
      closeBtnTop : 0,bottomSheetHeight : 50,selectedTab : 0,showImages : [],profileImages : [],
    }
  }
  callFunction = (uid,toUpdate) => {
    if(toUpdate){
      this.setState({ updating : true })
    } 
    const toSeeUser = this.props.route.params.params.uid
    if(!toSeeUser){
      this.props.navigation.goBack()
    }
    if(toSeeUser == uid){
      this.props.navigation.replace("Profile")
    }
    this.setState({calledOnce : true,userId : uid, foundUserId : toSeeUser })
    this.findUser(uid)
    this.findOtherUser(toSeeUser)
    this.seeRelationBetweenAccounts()
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

  selectTab = (whichOne) => {
    this.ref.current.animateNextTransition();
    var images = []
    if(whichOne == 0){
      images = this.state.profileImages
    }
    else{
      images = this.state.posts 
    }
    this.setState({ selectedTab : whichOne, showImages : images, })
  }
  transition = (
    <Transition.Together>
      <Transition.In
        type="slide-right"
        durationMs={1000}
        interpolation="easeInOut"
      />
      <Transition.In type="fade" durationMs={1000} />
      <Transition.Change />
    </Transition.Together>
  );
  findUser = uid => {
    var users = firebase.database().ref("Users")
    users.on("value",data => {
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
        if(matchedUser.length == 1){
          this.setState({ user : matchedUser[0],objectIdUser : keys[matchedIndex] , })
        }
      }else{
        this.props.navigation.replace("Register")
      }
    })
  }
  findOtherUser = userId => {
    var users = firebase.database().ref("Users")
    users.on("value",data => {
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
          if(userId === u.uid){
            matchedIndex = index
          }
          index++;
          return userId === u.uid
        })
        if(matchedUser.length == 1){
          var posts = [],taggedPosts = [];
          var profileImages = matchedUser[0].profileImages ? matchedUser[0].profileImages : []
          if(matchedUser[0].posts){
            matchedUser[0].posts.forEach( eachPost => {
              var post = firebase.database().ref("Posts/" + eachPost.postObjectId)
              post.on("value",postData => {
                if(postData.val()){
                  posts.push(postData.val())
                }
              })
            } )
          }
          if(matchedUser[0].taggedPost){
            taggedPosts = matchedUser[0].taggedPost
          }
          this.setState({ foundUser : matchedUser[0],objectIdOther : keys[matchedIndex],
            posts : posts,profileImages,showImages : profileImages })
          if(matchedUser[0].userProfile){
            this.setState({ otherImage : matchedUser[0].userProfile })
          }else{
            this.setState({otherImage : false })
          }
        }
      }else{
        this.props.navigation.replace("Register")
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
  toCheckInFollowers = () => {
    if(this.state.user.followers != undefined){
      return this.state.user.followers.filter(Followers => {
        return Followers.uid === this.state.foundUser.uid
      }) 
    }
  }
  toCheckInFollowing = () => {
    if(this.state.user.following != undefined){
      return this.state.user.following.filter(Following => {
        return Following.uid === this.state.foundUser.uid
      })
    }
  }
  toCheckReceivedRequest = () => {
    if(this.state.user.hasOwnProperty('receivedRequests')){
      if(this.state.user.receivedRequests.filter(request => {
        return request.userUid == this.state.foundUser.uid
      }).length != 0 ){
        return true
      }
    }
    return false
  }
  toCheckSentRequest = () => {
    if(this.state.user.hasOwnProperty("sentRequests")){
      if(this.state.user.sentRequests.includes(this.state.foundUser.uid)){
        return true
      }
    }
    return false
  }
  seeRelationBetweenAccounts = () => {
    var willNameULater =  this.toCheckInFollowers() 
    var willNameULater2 = this.toCheckInFollowing()
    var isReceivedRequest = this.toCheckReceivedRequest() //relation ->  this.setState({ relation : "Accept Follow Requests" })
    var isSentRequest = this.toCheckSentRequest() // relation -> this.setState({ relation : "Cancel Follow Request" })
    // only user -> other => relation = unfollow , options - following and unfollow
    // willNameULater -> it must be 0
    // willNameULater2 -> it must be 1
    if(willNameULater.length == 0 && willNameULater2.length == 1){
      this.setState({relation : "unfollow",bottomSheetHeight : 100,closeBtnTop : -20 })
    }
    //only other -> user => relation = follow back, options - follow back and to cancel following
    // willNameULater  -> it must be 1
    // willNameULater2 -> it must be 0
    if(willNameULater.length == 1 && willNameULater2 == 0){
      this.setState({ relation : "Follow Back",bottomSheetHeight : 100,closeBtnTop : -20  })
    }
    // user has sent follow request to other => options => cancel request
    if(isSentRequest){
      this.setState({ relation : "Sent Follow Request",bottomSheetHeight : 50,closeBtnTop : 0  })
    }
    // user has received follow request from other => options => accept or decline request
    if(isReceivedRequest){
      this.setState({ relation : "Received Follow Request",bottomSheetHeight : 100,closeBtnTop : -20  })
    }
    // to check if user <- other and user has sent request for follow back => options -> cancel follow request
    // willNameULater -> it must be 1 and sentRequest must be true
    if(willNameULater.length == 1 && isSentRequest){
      this.setState({ relation : "Unfollow and Sent Request",bottomSheetHeight : 100,closeBtnTop : -20  })
    }
    //both user -> <- other => relation = "both ways",options = following and unfollow and cancel following
    // willNameULater  -> it must be 1
    // willNameULater2 -> it must be 1
    if(willNameULater.length == 1 && willNameULater2.length == 1){
      this.setState({ relation : "Both Ways",bottomSheetHeight : 150,closeBtnTop : -50  })
    }
    // user -> other => means present in following and has received request => options -> following and accept or decline request
    if(willNameULater2.length == 1 && isReceivedRequest ){
      this.setState({ relation : "Following and Received Request",bottomSheetHeight : 150,closeBtnTop : -50  })
    }
    this.setState({ waiting : false,updating : false })
  }
  //rendering element based on relations
  relationFollow = () => {
    return(
      <View style={[STYLES.bottomSheet,{ height : 50,marginBottom : 60 }]}>
        <TouchableOpacity style={{flex : 1,justifyContent : "center",alignItems : "center"}}
          onPress={()=>{this.sendFollowRequest()}}  >
            <Text style={{color : "#94f00a",fontWeight : "bold",marginLeft : -25}}> Send Follow Request </Text>
        </TouchableOpacity>
      </View>
    )
  }
  relationUnfollow = () => {
    return(
      <View style={[STYLES.bottomSheet,{ height : 100,marginBottom : 60 }]}>
        <TouchableOpacity onPress={()=>{{ }} } style={[styles.eachNumber,styles.hr]} >
            <Text style={{color : "white",fontWeight : "bold",marginLeft : -25}}> Following </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{{ this.unFollow() }} } style={styles.eachNumber} >
            <Text style={{color : "#de2c2c",fontWeight : "bold",marginLeft : -25}}> Unfollow </Text>
        </TouchableOpacity>
      </View>
  )
  }
  relationFollowBack = () => {
    return(
      <View style={[STYLES.bottomSheet,{ height : 100,marginBottom : 60 }]}>
        <TouchableOpacity onPress={()=>{{ this.followBack() }} } style={[styles.eachNumber,styles.hr]} >
            <Text style={{color : "#2cde3e",fontWeight : "bold",marginLeft : -25}}> Follow Back </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{this.removeAsFollower()}}  style={styles.eachNumber} >
            <Text style={{color : "#000",fontWeight : "bold",marginLeft : -25}}> Remove As Follower </Text>
        </TouchableOpacity>
      </View>
    )
  }
  relationBothWays = () => {
    return(
      <View style={[STYLES.bottomSheet,{ height : 150,marginBottom : 60 }]}>
        <TouchableOpacity onPress={()=>{{ }} } style={[styles.eachNumber,styles.hr]} >
            <Text style={{color : "white",fontWeight : "bold",marginLeft : -25}}> Following </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{{ this.unFollow() }} } style={[styles.eachNumber,styles.hr]} >
            <Text style={{color : "#de2c2c",fontWeight : "bold",marginLeft : -25}}> Unfollow </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{this.removeAsFollower()}}  style={styles.eachNumber} >
            <Text style={{color : "#000",fontWeight : "bold",marginLeft : -25}}> Remove As Follower </Text>
        </TouchableOpacity>
      </View>
    )
  }
  relationSentRequest = () => {
    return(
      <View style={[STYLES.bottomSheet,{ height : 50,marginBottom : 60 }]}>
        <TouchableOpacity onPress={()=>{this.cancelFollowRequest()}}  style={styles.eachNumber} >
            <Text style={{color : "#de2c2c",fontWeight : "bold",marginLeft : -25}}> Cancel Sent Request </Text>
        </TouchableOpacity>
      </View>
    )
  }
  relationReceivedRequest = () => {
    return(
      <View style={[STYLES.bottomSheet,{ height : 100,marginBottom : 60 }]}>
        <TouchableOpacity onPress={()=>{this.acceptFollowRequest()}}  style={[styles.eachNumber,styles.hr]} >
            <Text style={{color : "#94f00a",fontWeight : "bold",marginLeft : -25}}> Accept Request </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{this.cancelFollowRequest()}}  style={styles.eachNumber} >
            <Text style={{color : "#de2c2c",fontWeight : "bold",marginLeft : -25}}> Decline Request </Text>
        </TouchableOpacity>
      </View>
    )
  }
  relationUnfollowSentRequest = () => {
    return(
      <View style={[STYLES.bottomSheet,{ height : 100,marginBottom : 60 }]}>
        <TouchableOpacity onPress={()=>{this.removeAsFollower()}}  style={[styles.eachNumber,styles.hr]} >
          <Text style={{color : "#de2c2c",fontWeight : "bold",marginLeft : -25}}> Remove As Follower </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{this.cancelFollowRequest()}}  style={styles.eachNumber} >
          <Text style={{color : "#000",fontWeight : "bold",marginLeft : -25}}> Cancel Request </Text>
        </TouchableOpacity>
      </View>
    )
  }
  relationFollowingReceived = () => {
    return(
      <View style={[STYLES.bottomSheet,{ height : 150,marginBottom : 60 }]}>
        <TouchableOpacity onPress={()=>{}}  style={[styles.eachNumber,styles.hr]} >
          <Text style={{color : "#fff",fontWeight : "bold",marginLeft : -25}}> Following </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{this.acceptFollowRequest()}}  style={[styles.eachNumber,styles.hr]} >
            <Text style={{color : "#94f00a",fontWeight : "bold",marginLeft : -25}}> Accept Request </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{this.cancelFollowRequest()}}  style={styles.eachNumber} >
            <Text style={{color : "#de2c2c",fontWeight : "bold",marginLeft : -25}}> Decline Request </Text>
        </TouchableOpacity>
      </View>
    )
  }
  // function to be called
  removeAsFollower = () => {
    Alert.alert(
      "Remove " + this.state.foundUser.userName,
      `${this.state.foundUser.name} will no longer follow you`,
      [
        {
          text : 'Cancel' , onPress : () => {}
        },
        {
          text : "Proceed", onPress : () => {this.removeAsFollowerAction()}
        }
      ]
    )
  }
  removeAsFollowerAction = () => {
    var currentUser = firebase.database().ref("Users/" + this.state.objectIdUser )
    var otherUser = firebase.database().ref("Users/" + this.state.objectIdOther )
    
    var numOfFollowers,followersOfItself;
    currentUser.on("value",data => {
      if(data.val()){
        numOfFollowers = data.val().numFollowers
        numOfFollowers -= 1
        followersOfItself = data.val().followers
        var index = 0 ; var matchedIndex;
        if(followersOfItself != undefined){
          var otherUserInItselfFollowers = followersOfItself.filter(any => {
            if(any.uid == this.state.foundUser.uid ){
              matchedIndex = index
            }
            index++
            return any.uid == this.state.foundUser.uid
          })
          if(otherUserInItselfFollowers.length == 0){
            Alert.alert(this.state.foundUser.name + " no longer followes you")
            return
          }else{
            var newList = followersOfItself.slice(0,matchedIndex)
            newList = newList.concat(followersOfItself.slice(matchedIndex+1,followersOfItself.length))
            followersOfItself = newList
          }
        }
      }
    })

    var numOfFollowing,followingOfOther;
    otherUser.on("value",data => {
       if(data.val()){
        numOfFollowing = data.val().numFollowing
        numOfFollowing -= 1
        followingOfOther = data.val().following
        var index = 0;var matchedIndex;
        if(followingOfOther != undefined){
        var loggedInUserInFollowingOfOther = followingOfOther.filter(any => {
          if(any.uid == this.state.user.uid){
            matchedIndex = index
          }
          index++
          return any.uid == this.state.user.uid
        })
        if(loggedInUserInFollowingOfOther.length == 0){
          return
        }
        delete followingOfOther[matchedIndex]
      }
      }
    })

    currentUser.update({
      numFollowers : numOfFollowers, followers : followersOfItself
    }).then(()=>{})
    .catch(err => {alert(err.message)})

    otherUser.update({
      numFollowing : numOfFollowing, following : followingOfOther
    })
    .then(()=>{
      alert(this.state.foundUser.name + " no longer follows you")
      this.callFunction(this.state.userId,true)
    })
    .catch(err => {alert(err.message)})
  }
  unFollow = () => {
    Alert.alert(
      "Unfollow " + this.state.foundUser.userName,
      `Are you sure want to unfollow ${this.state.foundUser.name}`,
      [
        {
          text : "Cancel" , onPress : () => { }
        },
        {
          text : "Sure", onPress : () => {this.unFollowAction()}
        }
      ]
    )
  }
  unFollowAction = () => {
    var currentUser = firebase.database().ref("Users/" + this.state.objectIdUser )
    var otherUser = firebase.database().ref("Users/" + this.state.objectIdOther )
    
    var numOfFollowing,followingOfItself;
    currentUser.on("value",data => {
      if(data.val()){
        numOfFollowing = data.val().numFollowing
        numOfFollowing -= 1
        followingOfItself = data.val().following
        var index = 0; var matchedIndex
        if(followingOfItself != undefined){
          var otherUserInFollowing = followingOfItself.filter(any => {
            if(any.uid == this.state.foundUser.uid){
              matchedIndex = index
            }
            index++
            return any.uid == this.state.foundUser.uid
          })
          if(otherUserInFollowing.length == 0){
            alert("You already have unfollowed " + this.state.foundUser.userName )
            return
          }else{
            var newList = followingOfItself.slice(0,matchedIndex)
            newList = newList.concat(followingOfItself.slice(matchedIndex+1,followingOfItself.length))
            followingOfItself = newList
          }
        }
      }
    })

    var numOfFollowers,followersOfOther;
    otherUser.on("value",data => {
      if(data.val()){
        numOfFollowers = data.val().numFollowers
        numOfFollowers -= 1
        followersOfOther = data.val().followers
        var index =0; var matchedIndex;
        if(followersOfOther != undefined){
          var loggedInUserInFollowersOfOther = followersOfOther.filter(any => {
            if(any.uid == this.state.user.uid){
              matchedIndex = index
            }
            index++
            return any.uid == this.state.user.uid
          })
          if(loggedInUserInFollowersOfOther.length == 0){
            return
          }else{
            var newList = followersOfOther.slice(0,matchedIndex)
            newList = newList.concat(followersOfOther.slice(matchedIndex+1,followersOfOther.length))
            followersOfOther = newList
          }
        }
      }
    })

    currentUser.update({
      numFollowing : numOfFollowing, following : followingOfItself
    }).then(()=>{})
    .catch((err)=>{alert(err.message)})

    otherUser.update({
      numFollowers : numOfFollowers, followers : followersOfOther
    }).then(()=>{
      alert("You Unfollowed " + this.state.foundUser.userName )
      this.callFunction(this.state.userId,true)
    })
    .catch((err)=>{alert(err.message)})
  }
  followBack = () => {
    this.sendFollowRequest()
  }
  declineFollowRequest = () => {
    var currentUser = firebase.database().ref("Users/" + this.state.objectIdUser )
    var otherUser = firebase.database().ref("Users/" + this.state.objectIdOther )

    var currentNumReceivedRequests,ReceivedRequests;
    currentUser.on("value",data => {
      if(data.val()){
        currentNumReceivedRequests = data.val().numReceivedRequests
        currentNumReceivedRequests -= 1
        ReceivedRequests = data.val().receivedRequests
        var index = 0;var matchedIndex;
        if(ReceivedRequests != undefined){
          Request = ReceivedRequests.filter(R => {
            if(R.userUid == this.state.foundUser.uid){
              matchedIndex = index
            }
            index++
            return R == this.state.foundUser.uid
          })
          var newList = ReceivedRequests.slice(0,matchedIndex)
          newList = newList.concat(ReceivedRequests.slice(matchedIndex+1,ReceivedRequests.length))
          ReceivedRequests = newList
        }
      }
    })

    currentUser.update({
      numReceivedRequests : currentNumReceivedRequests, receivedRequests : ReceivedRequests
    }).then(()=>{ })
    .catch(()=>{ console.log(err);alert(err.message) })

    var currentNumSentRequest,SentRequests;
    otherUser.on("value",data => {
      if(data.val()){
        currentNumSentRequest = data.val().numSentRequests
        currentNumSentRequest -= 1
        SentRequests = data.val().sentRequests
        if(!SentRequests){
          return
        }
        if(!SentRequests.includes(this.state.user.uid)){
          return
        }
        var index = 0; var matchedIndex;
        if(SentRequests != undefined){
          var Request = SentRequests.filter(R => {
            if(R == this.state.user.uid ){
              matchedIndex = index
            }
            index++;
            return R == this.state.user.uid
          })
          var newList = SentRequests.slice(0,matchedIndex)
          newList = newList.concat(SentRequests.slice(matchedIndex+1,ReceivedRequests.length))
          SentRequests = newList
        }
      }
    })

    otherUser.update({
      numSentRequests : currentNumSentRequest, sentRequests : SentRequests 
    })
    .then(()=>{ 
      this.callFunction(this.state.userId,true)
    })
    .catch(err => { console.log(err);alert(err.message) })
  }
  cancelFollowRequest = () => {
    var currentUser = firebase.database().ref("Users/" + this.state.objectIdUser )
    var otherUser = firebase.database().ref("Users/" + this.state.objectIdOther )
    
    var SentRequests,currentNumSentRequest;
    currentUser.on("value",data => {
      if(data.val()){
        SentRequests = data.val().sentRequests
        currentNumSentRequest = data.val().numSentRequests
        currentNumSentRequest -= 1
        if(!SentRequests){
          return
        }
        if(!SentRequests.includes(this.state.foundUser.uid)){
          return
        }
        var index = 0; var matchedIndex;
        if(SentRequests != undefined){
          var Request = SentRequests.filter(R => {
            if(R == this.state.foundUser.uid ){
              matchedIndex = index
            }
            index++;
            return R == this.state.foundUser.uid
          })
          delete SentRequests[matchedIndex]
        }
      }
    })

    var currentNumReceivedRequests,ReceivedRequests,numNewNotifications;
    otherUser.on("value",data => {
      if(data.val()){
        currentNumReceivedRequests = data.val().numReceivedRequests
        currentNumReceivedRequests -= 1
        ReceivedRequests = data.val().receivedRequests
        var index = 0;var matchedIndex;
        if(ReceivedRequests != undefined){
          Request = ReceivedRequests.filter(R => {
            if(R.userUid == this.state.user.uid){
              matchedIndex = index
            }
            index++
            return R == this.state.user.uid
          })
          var newRequestList = ReceivedRequests.slice(0,matchedIndex)
          newRequestList = newRequestList.concat(ReceivedRequests.slice(matchedIndex+1,ReceivedRequests.length))
          ReceivedRequests = newRequestList
          numNewNotifications = (data.val().numNewNotifications) 
          numNewNotifications -= 1
        }
      }
    })
    currentUser.update({
      numSentRequests : currentNumSentRequest, sentRequests : SentRequests , 
    })
    .then(()=>{ })
    .catch(err => { console.log(err);alert(err.message) })

    otherUser.update({
      numReceivedRequests : currentNumReceivedRequests, receivedRequests : ReceivedRequests,numNewNotifications : numNewNotifications
    }).then(()=>{  
      this.callFunction(this.state.userId,true)
    })
    .catch(()=>{ console.log(err);alert(err.message) })
  }
  acceptFollowRequest = () => {
    var currentUser = firebase.database().ref("Users/" + this.state.objectIdUser )
    var otherUser = firebase.database().ref("Users/" + this.state.objectIdOther )

    var newNotificationsCurrentUser,numNewNotificationsCurrentUser,
    currentNumReceivedRequests,currentReceivedRequests,
    currentNumFollowers,currentFollowers;
    currentUser.on("value",data => {
      if(data.val()){
        newNotificationsCurrentUser = data.val().newNotifications
        numNewNotificationsCurrentUser = data.val().numNewNotifications
        if(newNotificationsCurrentUser == undefined){
          newNotificationsCurrentUser = []
        }
        var today = this.returnTime()
        var newNotification = {
          text : this.state.foundUser.userName + " started following you.",objectId : this.state.objectIdOther,
          image : this.state.foundUser.userProfile,uploadedTime : today.time,uploadedDate : today.date
        }
        numNewNotificationsCurrentUser += 1
        newNotificationsCurrentUser.unshift(newNotification)

        currentNumReceivedRequests = data.val().numReceivedRequests
        currentNumReceivedRequests -= 1

        currentReceivedRequests = data.val().receivedRequests
        var index=0;var matchedIndex;
        if(currentReceivedRequests != undefined){
          var MatchedRequest = currentReceivedRequests.filter(Request => {
            if(Request.userUid == this.state.foundUser.uid ){
              matchedIndex = index
            }
            index++;
            return Request == this.state.foundUser.uid
          })
          var newRequestList = currentReceivedRequests.slice(0,matchedIndex)
          newRequestList = newRequestList.concat(currentReceivedRequests.slice(matchedIndex+1,currentReceivedRequests.length))
          currentReceivedRequests = newRequestList
        }
        currentNumFollowers = data.val().numFollowers 
        currentNumFollowers += 1

        currentFollowers = data.val().followers
        var newFollower = {
          uid : this.state.foundUser.uid,
          objectId : this.state.objectIdOther
        } 
        currentFollowers.push(newFollower)
      }

    })   
    
    var newNumNotifications,currentNumSentRequest,SentRequests,currentNumFollowing,
    currentFollowing,newNotifications,messageList2 ;
    otherUser.on("value",data => {
      if(data.val()){
        newNumNotifications = (data.val().numNewNotifications)
        newNumNotifications += 1

        currentNumSentRequest = (data.val().numSentRequests ) - 1

        SentRequests = data.val().sentRequests
        var index=0;var matchedIndex;
        if(SentRequests != undefined){
          var MatchedRequest = SentRequests.filter(Request => {
            if(Request == this.state.user.uid){
              matchedIndex = index
            }
            index++;
            return Request == this.state.user.uid
          })
          var newRequestList = SentRequests.slice(0,matchedIndex)
          newRequestList = newRequestList.concat(SentRequests.slice(matchedIndex+1,SentRequests.length))
          SentRequests = newRequestList
        }
        currentNumFollowing = data.val().numFollowing
        currentNumFollowing += 1

        currentFollowing = data.val().following
        var newFollowing = {
          uid : this.state.user.uid,
          objectId : this.state.objectIdUser
        }
        currentFollowing.push(newFollowing)
        newNotifications = data.val().newNotifications
        if(newNotifications == undefined){
          newNotifications = []
        }
        var today = this.returnTime()
        var newNotification = {
            text : this.state.user.userName + " accepted your follow request",objectId : this.state.objectIdUser,
            image : this.state.user.userProfile,uploadedTime : today.time,uploadedDate : today.date
        }
        newNotifications.unshift(newNotification)

        index = 0;
        messageList2 = data.val().messageList
        var newEntryInML = {
          userUid : this.state.user.uid,
          objectId : this.state.objectIdUser,
          userProfile : this.state.user.userProfile,
          userName : this.state.user.userName,
          name : this.state.user.name,
          lastMsgText : "Message " + this.state.user.userName + " to start conversation!!!",
          time : today.time,
          date : today.date
        }
        if(messageList2 == undefined){
          messageList2 = [newEntryInML]
        }else{
          index = 0;
          var currentUserInML = messageList2.filter( eachEntry => {
            if(eachEntry.userUid == this.state.user.uid ){
              matchedIndex = index
            }
            index++;
            return eachEntry.userUid == this.state.user.uid
          } )
          if(currentUserInML.length == 0){
            messageList2.unshift(newEntryInML)
          }else{  }
        }
      }
    })
    currentUser.update({
      numReceivedRequests : currentNumReceivedRequests,receivedRequests : currentReceivedRequests,
      numFollowers :currentNumFollowers , numNewNotifications : numNewNotificationsCurrentUser,
       newNotifications : newNotificationsCurrentUser, followers : currentFollowers
    },err => {
      if(err){
        console.log(err);alert(err.message)
      }else{ }
    }) 

    otherUser.update({
      numSentRequests : currentNumSentRequest,sentRequests : SentRequests,numFollowing :currentNumFollowing ,
       following : currentFollowing,newNotifications : newNotifications,numNewNotifications : newNumNotifications,
       messageList : messageList2
    })
    .then(()=>{ 
      this.callFunction(this.state.userId,true)
    })
    .catch(err => {
      console.log(err)
      alert(err.message)
    })
  }
  sendFollowRequest = () => {
    var currentUser = firebase.database().ref("Users/" + this.state.objectIdUser )
    var otherUser = firebase.database().ref("Users/" + this.state.objectIdOther )
    
    var currentNumSentRequests,currentSentRequests;
    currentUser.on("value",data => {
      if(data.val()){
        currentNumSentRequests = data.val().numSentRequests
        currentNumSentRequests += 1
        currentSentRequests = data.val().sentRequests
        if(currentSentRequests == undefined){
          currentSentRequests = []
        }
        if(currentSentRequests.includes(this.state.foundUser.uid)){
          return
        }
        currentSentRequests.push(this.state.foundUserId)
      }
    })

    var num,currentNumReceivedRequests,currentReceivedRequests;
    otherUser.on("value",data => {
      if(data.val()){
        num = data.val().numNewNotifications
        num += 1
        currentNumReceivedRequests = data.val().numReceivedRequests
        currentNumReceivedRequests += 1
        currentReceivedRequests = data.val().receivedRequests
        if(currentReceivedRequests == undefined){
          currentReceivedRequests = []
        }
        if(currentReceivedRequests != undefined){
          if( currentReceivedRequests.filter(request => {
            return request.userUid == this.state.user.uid
          }).length != 0 ){
            return
          }else{
            var newRequest = {
              userUid : this.state.userId,objectId : this.state.objectIdUser,userProfile : this.state.user.userProfile,
              userName : this.state.user.userName,name : this.state.user.name
            }
            currentReceivedRequests.unshift(newRequest)
          }
        }
      }
    })

    currentUser.update({
      numSentRequests : currentNumSentRequests,sentRequests : currentSentRequests
    })
    .then( ()=>{} )
    .catch(err => {
      console.log(err)
      alert(err.message)
    })

    otherUser.update({
      numReceivedRequests : currentNumReceivedRequests,receivedRequests : currentReceivedRequests,numNewNotifications :  num
    })
    .then( () => { 
      this.callFunction(this.state.userId,true)
     } )
    .catch(err => {
      console.log(err)
      alert(err.message)
    })
  }
  onSwipe(gestureName, gestureState) {
    const {SWIPE_UP, SWIPE_DOWN, SWIPE_LEFT, SWIPE_RIGHT} = swipeDirections;
    console.log(gestureName)
    this.setState({gestureName: gestureName});
    switch (gestureName) {
      case SWIPE_UP:
        break;
      case SWIPE_DOWN:
          this.callFunction(this.state.userUid,true)
        break;
      case SWIPE_LEFT:
        break;
      case SWIPE_RIGHT:
          this.props.navigation.goBack()
        break;
    }
  }
  render(){
    if(this.state.waiting){
      return( 
        <View style={[STYLES.generalPage,{ justifyContent : "center",alignItems : "center",flex : 1 }]}>
          <Spinner color="red" size="large" />
        </View>
      )
     }else{
       return (
        <View style={[STYLES.generalPage,styles.container]}>
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
                        source={ this.state.user.userProfile  ? { uri : this.state.user.userProfile } : 
                        require("../../../assets/account.png") }
                    />
                  </Animated.View>
                  <Animated.View style={{flex : 1,position: "absolute",left : width*0.2}}>
                      <Text style={{color : "white",fontWeight : "bold",fontSize : 25}}> {this.state.user.userName} </Text>
                  </Animated.View>
                  <Animated.View style={{flex : 1,position: "absolute",right : width*0.05}}>
                    <TapGestureHandler onHandlerStateChange={this.onStateChange}>
                        <Animated.View style={{...styles.button,
                        opacity : this.buttonOpacity , transform : [{translateY : this.buttonY}] }}>
                            <Entypo name="dots-three-vertical" color="white" size={25} />
                        </Animated.View>
                    </TapGestureHandler>    
                  </Animated.View>
              </Animated.View>
              <Animated.ScrollView
                  bounces={false}
                  style={[{paddingTop : HEADER_HEIGHT-10,opacity : this.backgroundOpacity }]}
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
                  <View style={{flexDirection:'row'}}>
                      <View style={{marginVertical:15,marginLeft : 20}}>
                          <Avatar
                              size={85}
                              rounded
                              showEditButton='true'
                              source={ this.state.foundUser.userProfile ? {  uri : this.state.foundUser.userProfile } : require("../../../assets/account.png") }
                          />
                          <Text style={{color:'rgba(245,245,245,0.75)',marginVertical:10,fontSize : 20}}> {this.state.foundUser.name} </Text>
                      </View>
                      <View style={{marginLeft : 0}}>
                          <TouchableOpacity style={styles.button}>
                              <View style={{justifyContent:'center',alignItems:'center'}}>
                                  <Text style={{color:'rgba(245,245,245,0.75)',fontWeight:'bold',fontSize:15}}>{this.state.foundUser.numPosts}</Text>
                              </View>
                              <Text style={{color:'rgba(245,245,245,0.75)',fontSize:15}}>Posts</Text>
                          </TouchableOpacity>
                      </View>
                      <View>
                          <TouchableOpacity style={styles.button} onPress={()=>{this.props.navigation.navigate("Followers",{
                              params : {
                                uid : this.state.foundUserId
                              }
                          })}}>
                              <View style={{justifyContent:'center',alignItems:'center'}}>
                                  <Text style={{color:'rgba(245,245,245,0.75)',fontWeight:'bold',fontSize:15}}>{this.state.foundUser.numFollowers}</Text>
                              </View>
                              <Text style={{color:'rgba(245,245,245,0.75)',fontSize:15}}>Followers</Text>
                          </TouchableOpacity>
                      </View>
                      <View>
                          <TouchableOpacity style={styles.button} onPress={()=>{this.props.navigation.navigate("Following",{
                              params : {
                              uid : this.state.foundUserId
                              }
                          })}}>
                              <View style={{justifyContent:'center',alignItems:'center'}}>
                                  <Text style={{color:'rgba(245,245,245,0.75)',fontWeight:'bold',fontSize:15}}>{this.state.foundUser.numFollowing}</Text>
                              </View>
                              <Text style={{color:'rgba(245,245,245,0.75)',fontSize:15}}>Following</Text>
                          </TouchableOpacity>
                      </View> 
                  </View>
                  <View>
                      <Text style={{color:'rgba(245,245,245,0.75)',fontSize : 15,marginTop : -20,marginBottom : 10,marginLeft : 20}}> {this.state.foundUser.bio} </Text>
                  </View>
                  <View style={styles.mainSegment}>
                    <Button warning 
                      onPress={()=>{this.props.navigation.navigate("SendMessage",{ params : { uid : this.state.foundUser.uid } })}}
                      style={styles.msgButton} >
                      <Text style={{color : "white",fontSize : 20,fontWeight : "bold" }}>Message</Text>
                    </Button>
                  </View>
                  {this.state.relation != "Follow" || 
                  this.state.relation != "Sent Follow Request" || 
                  this.state.relation != "Received Follow Request" ? 
                  <Transitioning.View 
                          style={{flex : 1,width : width,marginTop : -25}}
                          ref={this.ref}
                          transition={ this.transition }
                      >
                        <View style={{...styles.tabContainer}}>
                            <View style={{
                                position : "absolute",
                                height : 70,
                                width : (width - 30 ) / 2,
                                backgroundColor : "#BADA55",
                                left : this.state.selectedTab == 0 ? 0 : null,
                                right : this.state.selectedTab == 1 ? 0 : null,
                                borderRadius : 70
                            }}>
                            </View>
                            <TouchableOpacity style={{flex : 1}} onPress={ () => {this.selectTab(0)} }>
                                <Tab icon="md-photos" 
                                isSelected={this.state.selectedTab == 0 ? true : false} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{flex : 1}} onPress={ () => {this.selectTab(1)} }>
                                <Tab icon="md-grid"
                                isSelected={this.state.selectedTab == 1 ? true : false}/>
                            </TouchableOpacity>
                          </View>
                          {this.state.selectedTab == 0 ? 
                            <View style={styles.imageContainer}>
                              {this.state.showImages.map( (item,index) => (
                                <View key={index} 
                                    style={[{ width : width/2 - 20,height : width/2 - 20,marginVertical : 10 }, 
                                      index == this.state.showImages.length - 1 ? { marginBottom : 150 } : null ]}>
                                    <Image 
                                        source={{uri : item.imageUrl}}
                                        style={{
                                            flex : 1,
                                            height : null,
                                            width : null
                                        }}
                                    />
                                </View>
                              ) )}
                            </View>
                            : <View style={styles.imageContainer}>
                                {this.state.showImages.map( (item,index) => (
                                   <TouchableOpacity
                                   onPress={() => { 
                                     this.props.navigation.navigate("ShowPost",{
                                       picData : item, user : this.state.user,objectId : this.state.objectIdUser,postObjectId : this.state.foundUser.posts[index].postObjectId,
                                       ownerUid : item.ownerUid,ownerObjectId : item.ownerObjectId,index : index
                                     })
                                    } }
                                   key={index} style={[{ width : width/3 - 20,height : width/3 - 20,marginVertical : 10 }, index == this.state.showImages.length - 1 ? { marginBottom : 150 } : null ]}>
                                   <Image 
                                       source={{uri : item.imageUrl}}
                                       style={{
                                           flex : 1,
                                           height : null,
                                           width : null
                                       }}
                                   />
                                 </TouchableOpacity>
                                ) )}
                              </View> 
                          }
                      </Transitioning.View>
                      : null  }
              </Animated.ScrollView>
              <Animated.View style={{height : height/5,...StyleSheet.absoluteFill, 
                  top : null,justifyContent : "center",zIndex : this.textInputZindex,
                  opacity : this.textInputOpacity,
                  transform : [{translateY : this.textInputY}],
                  }} 
              >
                <TapGestureHandler onHandlerStateChange={this.onCloseState}>
                    <Animated.View style={[STYLES.closeBtn,{ top : this.state.closeBtnTop }]}>
                        <Animated.Text style={{fontSize : 15,
                        transform : [ { rotate : concat(this.rotateCross,'deg') } ]}}>X</Animated.Text>
                    </Animated.View>
                </TapGestureHandler>
                <Animated.View>
                    {this.state.relation == 'unfollow' ? this.relationUnfollow() : <View /> }  
                    {this.state.relation == 'Follow Back' ? this.relationFollowBack() : <View /> } 
                    {this.state.relation == 'Follow' ? this.relationFollow() : <View /> }  
                    {this.state.relation == 'Sent Follow Request' ? this.relationSentRequest() : <View /> } 
                    {this.state.relation == 'Received Follow Request' ? this.relationReceivedRequest() : <View /> } 
                    {this.state.relation == 'Unfollow and Sent Request' ? this.relationUnfollowSentRequest() : <View /> } 
                    {this.state.relation == 'Following and Received Request' ? this.relationFollowingReceived() : <View /> } 
                    {this.state.relation == 'Both Ways' ? this.relationBothWays() : <View /> } 
                </Animated.View>
              </Animated.View>
            </GestureRecognizer>
        </View>
      );
  }
  }
}

const styles = StyleSheet.create({
    container: {
        minHeight : Dimensions.get("window").height,
        backgroundColor: 'rgba(8,8,8,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profile : {
        marginTop : 100,flexDirection : "row"
    },
    numbers : {
        flexDirection : "row",flex : 7
    },
    eachNumber : {
        flex : 1,justifyContent : "center",alignItems : "center",
    },
    middle : {
        marginTop : 10,
    },
    bio : {
        marginLeft : 15
    },
    buttons : {
        flex : 1, justifyContent : "center",marginLeft : 10,marginRight : 10 
    },
    posts : {
        marginTop : 10,flexDirection : "row",flexWrap : "wrap"
    },
    postSection : {
        minHeight : 500
    },
    button:{
        padding: 15,
        marginVertical:30,
        marginHorizontal:1
    },
    hr : { 
        borderBottomColor : "white",borderBottomWidth : 0.7,width : width - 40 
    },
    msgButton : {
      backgroundColor : "#0a75f0",
      height : 70,
      width : width-40,
      marginHorizontal : 20,
      borderRadius : 35,
      alignItems : "center",
      justifyContent : "center",
      marginVertical : 5,
      shadowOffset : { width : 2,height : 2},
      shadowColor : 'black',
      shadowOpacity : 0.2,
      elevation : 2
    },
    tabContainer : {
      height : 70,
      flexDirection : "row",
      marginTop : 40,
      width : width - 30,
      marginHorizontal : 15,
      backgroundColor : "lightgrey",
      borderRadius : 70,
      overflow : "hidden"
    },
    imageContainer : {
      flex : 1,
      flexDirection : "row",
      flexWrap : "wrap",
      justifyContent : "space-around"
    }
});
