import React, { Component } from 'react';
import { Image,View,StyleSheet,TouchableOpacity,Alert,KeyboardAvoidingView,FlatList,
    Dimensions,StatusBar } from 'react-native';
import {  Card, CardItem, Thumbnail, Text, Left, Body, Right,Spinner,Form,Textarea,ListItem,Input, List } from 'native-base';
import dateformat from 'dateformat'
import Animated from 'react-native-reanimated'
import {AntDesign,Ionicons,FontAwesome,Entypo} from '@expo/vector-icons'
import * as firebase from "firebase"

import { Avatar } from 'react-native-elements';

const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight

import STYLES from '../../styles/styles'
const {width} = Dimensions.get("window")

export class ReplyComment extends React.Component{
    constructor(props){
        super(props);
        this.scrollY = new Animated.Value(0)
        this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
        this.headerY = Animated.interpolate(this.diffClampScrollY,{
        inputRange : [0, HEADER_HEIGHT],
        outputRange : [0,-HEADER_HEIGHT]
        })
        this.state = {
            replies : [],comment : null,replyText : "",waiting : false,initialWaiting : true
        }
    }
    componentDidMount(){
        const user = this.props.route.params.user
        const owner = this.props.route.params.owner
        var ownerObjectId = this.props.route.params.ownerObjectId
        const imageIndex = this.props.route.params.imageIndex
        const commentIndex = this.props.route.params.commentIndex
        const objectId = this.props.route.params.objectId
        const postObjectId = this.props.route.params.postObjectId
        const imageUrl = this.props.route.params.imageUrl 
        if(owner && ownerObjectId && imageIndex != null && commentIndex != null && user && objectId  ){
            this.findPost(ownerObjectId,postObjectId,commentIndex)
            this.setState({ owner ,ownerObjectId, imageIndex, commentIndex, user,objectId ,postObjectId,imageUrl })
        }
    }
    findPost = (ownerObjectId,postObjectId,commentIndex) => {
        var Owner = firebase.database().ref("Users/" + ownerObjectId)
        Owner.on("value",data => {
            if(data.val()){
                var requiredPost ;
                var Post = firebase.database().ref("Posts/" + postObjectId)
                Post.on("value",postData => {
                    if(postData.val()){
                        requiredPost = postData.val()
                    }
                })
                var requiredComment = requiredPost.comment[commentIndex]
                requiredComment.commentByName = data.val().name;
                requiredComment.commentByUserProfile = data.val().userProfile
                if(requiredComment != undefined){
                    if(requiredComment.hasOwnProperty("replies")){
                        var replyList = []
                        requiredComment.replies.forEach( eachOne => {
                            var user = firebase.database().ref("Users/" + eachOne.replyByObjectId)
                            user.on("value",userData => {
                                if(userData.val()){
                                    var newOne = eachOne;
                                    newOne.replyByName = userData.val().name;
                                    newOne.replyByUserProfile = userData.val().userProfile
                                    replyList.push(newOne)
                                }
                            })
                        } )
                        this.setState({ replies : replyList })
                    }else{
                        this.setState({ replies : [] })
                    }
                    this.setState({ comment : requiredComment, initialWaiting : false })
                }
            }
        })
    }
    seeAccount = accountId => {
        if(this.state.user.uid === accountId){
            this.props.navigation.navigate("AccountScreen")
        }else{
            this.props.navigation.navigate("SeeAccount",{ userId : accountId })
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
                        return "Just now"
                    }else{
                        return ( (currentMinute-uploadedMinute) + " mins ago")
                    }
                }else{
                    var index1 = currentHour.indexOf(" ")
                    var index2 = uploadedHour.indexOf(" ")
                    var time1 = currentHour.slice(index1+1,currentHour.length)
                    var time2 = uploadedHour.slice(index2+1,uploadedHour.length)
                    if(time1 != time2){
                        return ( Math.abs((currentHour.slice(0,index1) - uploadedHour.slice(0,index2) )) + 12 + " h ago" )
                    }else
                        return ( Math.abs((currentHour.slice(0,index1) - uploadedHour.slice(0,index2) )) + " h ago" )
                }
            }else{
                if( currentDate - uploadedDate <= 3){
                    if(currentDate - uploadedDate == 1){
                        return "1 day ago"
                    }
                    return ( ( currentDate - uploadedDate ) + " days ago" )    
                }else{
                    return ( uploadedOnDate.slice(0,11)  )
                }
            }
        }else{
            return ( uploadedOnDate.slice(0,11) )
        }
    }
    addReply = async() => {
        if(this.state.replyText == ""){
            return
        }else{
            this.setState({ waiting : true })
            var Owner = firebase.database().ref("Users/" + this.state.ownerObjectId)
            await Owner.on("value",data => {
                if(data.val()){
                    var requiredPost ;
                    var Post = firebase.database().ref("Posts/" + this.state.postObjectId)
                    Post.on("value",data => {
                        if(data.val()){
                            requiredPost = data.val()
                        }
                    })
                    var allComments = requiredPost.comment
                    var requiredComment = requiredPost.comment[this.state.commentIndex]
                    var currentReplies;
                    if(requiredComment != undefined){
                        if(requiredComment.hasOwnProperty("replies")){
                            currentReplies = requiredComment.replies
                        }else{
                            currentReplies = []
                        }
                        var today = this.returnTime()
                        var newReply = {
                            replyText : this.state.replyText,replyByUid : this.state.user.uid,replyByObjectId : this.state.objectId,
                            uploadedTime : today.time,uploadedDate : today.date
                        }
                        currentReplies.unshift(newReply)
                        requiredComment.replies = currentReplies
                        requiredComment.numReply += 1
                        allComments[this.state.commentIndex] = requiredComment
                        Post.update({
                            comment : allComments,
                        })
                        .then(()=>{ this.findPost(this.state.ownerObjectId,this.state.postObjectId,this.state.commentIndex)
                            this.setState({replyText : "" }) })
                        .catch(err => { 
                            alert(err.message)
                            console.log(err)
                        })
                    }                    
                }
            })
            this.setState({ waiting : false })
        }
    }
    deleteReply = (index) => {
        Alert.alert(
            "Delete Reply",
            "Are you sure you want to delete this reply?",
            [
                {
                    text : "Cancel",onPress : () => {} 
                },{
                    text : "Yes",onPress : () => { this.deleteAction(index) }
                }
            ]
        )
    }
    deleteAction = (index) => {
        this.setState({ waiting : true })
        var Owner = firebase.database().ref("Users/" + this.state.ownerObjectId)
        Owner.on("value",data => {
            if(data.val()){
                var requiredPost ;
                var Post = firebase.database().ref("Posts/" + this.state.postObjectId)
                Post.on("value",data => {
                    if(data.val()){
                        requiredPost = data.val()
                    }
                })
                var allComments = requiredPost.comment
                var requiredComment = requiredPost.comment[this.state.commentIndex]
                if(requiredComment.replies != undefined){
                    var currentReplyList = requiredComment.replies
                    var newReplyList = currentReplyList.slice(0,index)
                    newReplyList = newReplyList.concat(currentReplyList.slice(index+1,currentReplyList.length))
                    requiredComment.replies = newReplyList
                    requiredComment.numReply -= 1
                    allComments[this.state.commentIndex] = requiredComment
                    Post.update({
                        comment : allComments,
                    })
                    .then(()=>{ this.findPost(this.state.ownerObjectId,this.state.postObjectId,this.state.commentIndex)
                        this.setState({replyText : "" }) })
                    .catch(err => { 
                        alert(err.message)
                        console.log(err)
                    })
                }
            }
        })
        this.setState({ waiting : false })
    }
    render(){
        if(this.state.initialWaiting){
            return(
                <View style={[STYLES.generalPage,{ justifyContent : "center",alignItems : "center",flex : 1 }]} >
                    <Spinner color="red" size="large" />
                </View>
            )
        }
        return(
            <View style={styles.container} >
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
                    <Animated.View style={{ position : "absolute", left : width * 0.03 ,marginTop : -30}}>
                        <TouchableOpacity style={{marginLeft : 20}} onPress={() => this.props.navigation.goBack()  }>
                            <Ionicons name="md-arrow-round-back" size={30} color="white" />
                        </TouchableOpacity> 
                    </Animated.View>
                    <Animated.View style={{ position : "absolute", left : width * 0.2 ,marginTop : -30}}>
                        <Avatar
                            size={50}
                            rounded
                            source={ this.state.imageUrl  ? { uri : this.state.imageUrl } : 
                            require("../../../assets/account.png") }
                        />
                    </Animated.View>
                    <Animated.View style={{ flexDirection : "row",position : "absolute",left : width * 0.35,
                        justifyContent : "center",alignItems : "center",marginTop : -25,}}>
                        <Text style={{fontSize : 24,fontWeight : "bold",color : "white"}}> {this.state.owner.userName} </Text>
                    </Animated.View>
            </Animated.View>
            <Animated.ScrollView
                bounces={false}
                style={[{paddingTop : HEADER_HEIGHT-20 }]}
                scrollEventThrottle={16}
                    onScroll={Animated.event([
                    {
                        nativeEvent : { contentOffset : {y : this.scrollY } }
                    }
                ])}
            >
                <KeyboardAvoidingView behavior="padding" >
                    <View style={{width : width,}}>
                        <Card style={{backgroundColor : "rgba(8,8,8,0.95)" }}>
                            <ListItem thumbnail>
                                <Left>
                                    <TouchableOpacity onPress={()=>{this.seeAccount(this.state.comment.commentByUid)}}>
                                        <Thumbnail source={{ uri: this.state.comment.commentByUserProfile }} />
                                    </TouchableOpacity>
                                </Left>
                                <Body>
                                    <Text style={STYLES.specialColor} note numberOfLines={1}> {this.state.comment.commentByName} </Text>
                                    <Text style={{color : "white"}}> {this.state.comment.commentText}  </Text>
                                    <CardItem style={{backgroundColor : "rgba(8,8,8,0.95)" }}>                                                     
                                        <Right>
                                            <Text style={STYLES.specialColor} > {this.whatToWrite(this.state.comment.uploadedDate,this.state.comment.uploadedTime)} </Text>
                                        </Right>
                                    </CardItem>
                                </Body>
                            </ListItem>
                            <CardItem style={{borderWidth : 1,borderColor : "white",flexDirection : "row",width : "100%",backgroundColor : "rgba(8,8,8,0.95)" }}>
                                <Thumbnail style={{marginRight : "5%"}}  source={{ uri : this.state.user.userProfile }} />
                                <Input
                                    placeholderTextColor="white"
                                    style={{borderRadius : 5,borderWidth : 1,color : "white",borderColor : "white"}} onChangeText={replyText => {this.setState({ replyText })}}
                                    value={this.state.replyText} placeholder="Add a new comment" />
                                <TouchableOpacity onPress={()=>{this.addReply()}} style={{marginLeft : "2%",borderRadius : 100,width : 40,backgroundColor : "#2C3335",height : 50,justifyContent : "center",alignItems : "center"}}>
                                    <FontAwesome name="arrow-right" color="white" size={30} />
                                </TouchableOpacity>
                            </CardItem>
                            <List>
                                {this.state.replies.map( (item,index) => (
                                    <ListItem style={index == this.state.replies.length - 1 && index > 5 ? {marginBottom : 100} : null} key={index} thumbnail>
                                        <Left>
                                            <TouchableOpacity onPress={()=>{this.seeAccount(item.replyByUid)}}>
                                                <Thumbnail source={{ uri: item.replyByUserProfile }} />
                                            </TouchableOpacity>
                                        </Left>
                                        <Body>
                                            <Text style={STYLES.specialColor} note numberOfLines={1}> {item.replyByName} </Text>
                                            <Text style={{color : "white"}}> {item.replyText}  </Text>
                                            <CardItem style={{ backgroundColor : "rgba(8,8,8,0.95)" }}> 
                                                {item.replyByUid == this.state.user.uid ?
                                                    <Left>
                                                        <TouchableOpacity onPress={()=>{this.deleteReply(index)}} style={{ position : "absolute",right : 0, backgroundColor : "#BA2F16",height : 30,width : 40,alignItems : "center",justifyContent : "center" }}>
                                                            <Entypo name="trash" color="white" size={20} /> 
                                                        </TouchableOpacity>
                                                    </Left>
                                                : <Left /> }                                                    
                                                <Right>
                                                    <Text style={STYLES.specialColor}> {this.whatToWrite(item.uploadedDate,item.uploadedTime)} </Text>
                                                </Right>
                                            </CardItem>
                                        </Body>
                                    </ListItem>
                                ) )}
                            </List>
                        </Card>
                    </View>
                    
                </KeyboardAvoidingView>
            </Animated.ScrollView>
        </View>

        )
    }
}

const styles = StyleSheet.create({
    container : {
        minHeight : Dimensions.get("window").height,
        backgroundColor: 'rgba(8,8,8,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },
})