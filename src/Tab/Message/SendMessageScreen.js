import React from 'react';
import { StyleSheet, Text, View,ScrollView,Dimensions,StatusBar,KeyboardAvoidingView,TouchableOpacity,Platform} from 'react-native';
import {Button,Item,Input,ListItem, List } from 'native-base'
import * as firebase from 'firebase'
import {FontAwesome,Ionicons} from '@expo/vector-icons'
import dateformat from 'dateformat'
import Animated from 'react-native-reanimated'
const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight
import { Avatar } from 'react-native-elements';
import * as Font from 'expo-font'
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';

const {width,height} = Dimensions.get("screen")

import STYLES from '../../styles/styles'
import config from "../config"

export class SendMessageScreen extends React.Component {
  constructor(props){
    super(props);
    this.ref = React.createRef();
    this.scrollY = new Animated.Value(0)
    this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
    this.headerY = Animated.interpolate(this.diffClampScrollY,{
      inputRange : [0, HEADER_HEIGHT],
      outputRange : [0,-HEADER_HEIGHT]
    })
    this.state = {
        user : null,userId : null,foundUser : null,foundUserId : null,objectIdUser : null,objectIdOther : null,
        messages : [],message : "",waiting : true,fontLoaded : false
    }
  }
  componentDidMount(){
      firebase.auth().onAuthStateChanged(authenticate => {
        if(authenticate){
            const toSeeUser = this.props.route.params.params.uid
            if(!toSeeUser){
                this.props.navigation.goBack()
            }
            this.setState({ userId : authenticate.uid, foundUserId : toSeeUser,today : this.todayDate()})
            this.findUser(authenticate.uid)
            this.findOtherUser(toSeeUser)
            this.findMessages()
            this.loadFonts()
        }else{
            this.props.navigation.replace("Signin")
        }
      })
  }
  loadFonts = async() => {
    await Font.loadAsync({
      'Satisfy' : require("../../../assets/fonts/Satisfy-Regular.ttf"),
      'Caveat' : require("../../../assets/fonts/Caveat-Regular.ttf"),
    })
    this.setState({ fontLoaded : true })
  }
  findUser = async uid => {
    var users = firebase.database().ref("Users")
    await users.on("value",data => {
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
          this.setState({ user : matchedUser[0],objectIdUser : keys[matchedIndex]})
        }
      }else{
        this.props.navigation.replace("Signup")
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
          this.setState({ foundUser : matchedUser[0],objectIdOther : keys[matchedIndex] })
        }
      }else{
        this.props.navigation.replace("Signup")
      }
    })
  }
  findMessages = () => {
    var messages = this.state.user.messages
    if(messages == undefined){
      this.setState({ messages : [] })
    }else{
      var msgsWithOtherUser = messages.filter(withEach => {
        return withEach.otherUserUid === this.state.foundUser.uid
      })
      if(msgsWithOtherUser.length == 1){
        var msgs = msgsWithOtherUser[0].Messages
        msgs.sort(function(a, b) { 
           return new Date(a.timestamp) - new Date(b.timestamp);  
        });
        this.setState({ messages : msgs, waiting : false })
      }
    }
  }
  returnTime = () => {
    var now = new Date();
    var Dates = dateformat(now, 'mmm d yyyy h:MM:ss TT');
    var time = dateformat(now, 'h:MM TT')
    return {
      time : time, date : Dates
    }
  }
  append = message => {
    var currentUser = firebase.database().ref("Users/" + this.state.objectIdUser )
    var otherUser = firebase.database().ref("Users/" + this.state.objectIdOther )
    
    const data = this.returnTime()
    var newMessage = {
      text : message,
      timestamp : data.time,
      user : { _id : this.state.user.uid },
      date : data.date,
      _id : this.state.user.uid
    }

    var currentMessages,messageList;
    currentUser.on("value",DATA => {
      if(DATA.val()){
        currentMessages = DATA.val().messages
        var index = 0 ; var matchedIndex;
        var msgsWithOther = currentMessages.filter(withEach => {
          if(withEach.otherUserUid == this.state.foundUser.uid){
            matchedIndex = index
          }
          index++
          return withEach.otherUserUid == this.state.foundUser.uid 
        })
        if(msgsWithOther.length == 0){
          currentMessages.push({
            otherUserUid : this.state.foundUser.uid ,
            Messages : [newMessage]
          })
        }else{
          currentMessages[matchedIndex].Messages.push(newMessage)
        }
        messageList = DATA.val().messageList
        var newEntryInML = {
          userUid : this.state.foundUser.uid,
          objectId : this.state.objectIdOther,
          userProfile : this.state.foundUser.userProfile,
          userName : this.state.foundUser.userName,
          name : this.state.foundUser.name,
          lastMsgText : message,
          time : data.time,
          date : data.date
        }
        if(messageList == undefined){
          messageList = [newEntryInML]
        }else{
          index = 0;
          var otherUserInML = messageList.filter( eachEntry => {
            if(eachEntry.userUid == this.state.foundUser.uid ){
              matchedIndex = index
            }
            index++;
            return eachEntry.userUid == this.state.foundUser.uid
          } )
          if(otherUserInML.length == 0){
            messageList.unshift(newEntryInML)
          }else{
            
            var newList = messageList.slice(0,matchedIndex)
            newList = newList.concat(messageList.slice(matchedIndex + 1, messageList.length ))
            messageList = newList
            messageList.unshift(newEntryInML)
          }
        }
      }
    })

    var currentMessages2,messageList2;
    otherUser.on("value",DATA => {
      if(DATA.val()){
        currentMessages2 = DATA.val().messages
        var index = 0 ; var matchedIndex;
        var msgsWithOther2 = currentMessages2.filter(withEach => {
          if(withEach.otherUserUid == this.state.user.uid){
            matchedIndex = index
          }
          index++
          return withEach.otherUserUid == this.state.user.uid 
        })
        if(msgsWithOther2.length == 0){
          currentMessages2.push({
            otherUserUid : this.state.user.uid ,
            Messages : [newMessage]
          })
        }else{
          currentMessages2[matchedIndex].Messages.push(newMessage)
        }
        index = 0;
        messageList2 = DATA.val().messageList
        var newEntryInML = {
          userUid : this.state.user.uid,
          objectId : this.state.objectIdUser,
          userProfile : this.state.user.userProfile,
          userName : this.state.user.userName,
          name : this.state.user.name,
          lastMsgText : message,
          time : data.time,
          date : data.date
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
          }else{
            var newList = messageList2.slice(0,matchedIndex)
            newList = newList.concat(messageList2.slice(matchedIndex + 1, messageList2.length ))
            messageList2 = newList
            messageList2.unshift(newEntryInML)
          }
        }
      }
    })

    currentUser.update({
      messages : currentMessages,messageList : messageList
    })
    .then(()=> {  this.setState({ message : "" })  })
    .catch(err => {alert(err.message)})

    otherUser.update({
      messages : currentMessages2,messageList : messageList2
    })
    .then(()=>{this.findMessages()})
    .catch(err => {alert(err.message)})
  }
  todayDate = () => {
    var now = new Date();
    return dateformat(now,'mmm d yyyy')
  }
  sendToMsgScreen = () => {
    this.props.navigation.push("Message",{
      params : { objectId : this.state.objectIdUser }
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
        // this.setState({backgroundColor: 'green'});
        break;
      case SWIPE_LEFT:
        // this.setState({backgroundColor: 'blue'});
        break;
      case SWIPE_RIGHT:
        // this.setState({backgroundColor: 'yellow'});
        this.sendToMsgScreen()
        break;
    }
  }
 
  render(){
    if( this.state.waiting || !this.state.fontLoaded ){
      return(  
        <Text style={{color : "white"}}> Waiting </Text>
      )
     }else{
        return (
          <KeyboardAvoidingView  behavior="position" style={[{flex: 1},STYLES.generalPage]}  >
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
                  <Animated.View style={{position : "absolute",left : width*0.05 ,marginTop : -30}}>
                      <TouchableOpacity  onPress={() => this.props.navigation.goBack()  }>
                          <Ionicons name="md-arrow-round-back" size={30} color="white" />
                      </TouchableOpacity> 
                  </Animated.View>
                  <Animated.View style={{position : "absolute",left : width * 0.15 ,marginTop : -30}}>
                  <Avatar
                      size={50}
                      rounded
                      source={ this.state.foundUser.userProfile  ? { uri : this.state.foundUser.userProfile } : 
                      require("../../../assets/account.png") }
                  />
                  </Animated.View>
                  <Animated.View style={{position : "absolute",left : width * 0.30,marginTop : -30 }}>
                      <Text style={{color : "#fff",fontWeight : "bold",fontSize : 25, }}> {this.state.foundUser.userName} </Text>
                  </Animated.View>
              </Animated.View>
              <View style={{height : 80}} />
              <ScrollView 
                ref={ref => this.scrollView = ref}
                  style={[{minHeight : height-150 }]}
                  onContentSizeChange={(width, height)=>{        
                    this.scrollView.scrollToEnd({animated: true});
                  }}
                >
                  <List>
                    {this.state.messages.map( (item,index) => (
                      <View key={index} style={{width : "100%"}}>
                      { item._id == this.state.user.uid ?
                      <ListItem style={{flexDirection : "column"}}>
                        <Item style={{position : "absolute",left : 0,marginTop : 5}}>
                          <Text style={{color : "white",fontFamily : "Satisfy",}}> {this.state.user.name} </Text>
                        </Item>
                        <Item info style={[styles.messages,{backgroundColor : "#F5BCBA",marginTop : 20}]} >
                          <Text style={{color : "#000",fontFamily : "Caveat" ,fontSize : 20,}}> {item.text} 
                            {this.state.today != item.date.slice(0,11) ? 
                              <Text style={{fontSize : 14}}> ({item.date.slice(0,11)}) </Text> : <Text /> 
                            }
                            <Text style={{fontSize : 14}}> ({item.timestamp}) </Text> 
                          </Text>
                        </Item>
                      </ListItem>
                      : 
                      <ListItem style={{flexDirection : "column"}}>
                        <Item style={{position : "absolute",left : 0,marginTop : 15}}>
                            <Text style={{color : "white",fontFamily : "Satisfy",}}> {this.state.foundUser.name} </Text>
                        </Item>
                          <Item style={[styles.messages,{backgroundColor : "#FBD28B",marginTop : 30}]} >
                            <Text style={{color : "#000",fontFamily : "Caveat",fontSize : 17}}> {item.text}
                              {this.state.today != item.date.slice(0,11) ? 
                                <Text style={{fontSize : 14}}> ({item.date.slice(0,11)}) </Text> : <Text /> } 
                              <Text style={{fontSize : 10}}> ( {item.timestamp}) </Text> 
                            </Text>
                          </Item>
                      </ListItem> }
                    </View>
                    ) )}
                  </List>
                <Item style={{marginTop : 10,borderWidth : 3,borderColor : "red"}}>
                    <Input value={this.state.message} 
                      style={{flex : 12,color : "white",marginLeft : 10,fontFamily : "Caveat"}} 
                      onChangeText={ message => this.setState({ message }) } placeholder="Type message ...." 
                      placeholderTextColor="white"
                    />
                    {this.state.message == "" ? <View /> :  
                      <Button warning onPress={()=>{this.append(this.state.message)}} rounded style={{flex : 2}}>
                        <FontAwesome name="arrow-right" color="white" size={20} />
                      </Button> }
                  </Item> 
                <View style={{height : 15,zIndex : 0}} />
              </ScrollView>
            </GestureRecognizer>
        </KeyboardAvoidingView>
        );
    }
}
}

const styles = StyleSheet.create({
  container: {
    flex : 1
  },
  form : {
    position : "absolute",bottom : 0,width : "100%"
  },
  messages : {
    justifyContent : "space-between",alignItems : "center",width : "100%",minHeight : 50
  },
});
