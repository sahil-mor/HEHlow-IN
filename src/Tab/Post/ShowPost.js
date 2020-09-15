import React, { Component } from 'react';
import { Image,View,StyleSheet,TouchableOpacity,Alert,KeyboardAvoidingView,
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


export class ShowPost extends Component {
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
            data : null,userPic : null,uploading : false,objectId : null,likedBy : [],waiting : false,
            editPost : false,caption : "",addComment : true,newComment : "",owner : null,initialWaiting : true
        }
    }
    componentDidMount(){
        var Data = this.props.route.params.picData
        var User = this.props.route.params.user
        var ObjectId = this.props.route.params.objectId
        var PostObjectId = this.props.route.params.postObjectId
        var OwnerUid = this.props.route.params.ownerUid
        var OwnerObjectId = this.props.route.params.ownerObjectId
        var Index = this.props.route.params.index
        if(Data && User && ObjectId  && OwnerUid && OwnerObjectId && PostObjectId){
            this.findOwner(OwnerObjectId,OwnerUid,User.uid,User)
            this.findPost(OwnerObjectId)
            this.setState({  user : User,objectId : ObjectId,imageIndex : Index,ownerUid : OwnerUid,postObjectId : PostObjectId,
                OwnerObjectId : OwnerObjectId, caption : Data.caption })
        }else{
            this.props.navigation.goBack()
        }
    }
    findOwner = (ownerObjectId,ownerUid,userUid,user) => {
        if(ownerUid == userUid){
            this.setState({ owner : user })
        }else{
            var Owner = firebase.database().ref("Users/" + ownerObjectId)
            Owner.on("value",data => {
                if(data.val()){
                    this.setState({ owner : data.val() })
                }
            })
        }
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
    findPost = async (objectId) => {
        var User = await firebase.database().ref("Users/" + objectId)
        User.on("value",data => {
            if(data.val()){
                var allPosts = data.val().posts
                if(allPosts){    
                    var currentPost;
                    var Post = firebase.database().ref("Posts/" + this.state.postObjectId)
                    Post.on("value",data => {
                        if(data.val()){
                            currentPost = data.val()
                        }
                    })
                    if(currentPost.likes){
                        this.setState({ likedBy : currentPost.likes })
                    }
                    var commentList = []
                    if(currentPost.comment != undefined){
                        currentPost.comment.filter(eachComment => {
                            var user = firebase.database().ref("Users/" + eachComment.commentByObjectId)
                            user.on("value",data=>{
                                if(data.val()){
                                    var newOne = eachComment
                                    newOne.commentByName = data.val().name;
                                    newOne.commentByUserProfile = data.val().userProfile
                                    commentList.push(newOne)
                                }
                            })
                        })
                    }
                    this.setState({ data : currentPost,comments : commentList,initialWaiting : false })
                }
            }else{
                
            }
        })
    }
    likeImage = async () => {
        this.setState({ waiting : true })
        var User = await firebase.database().ref("Users/" + this.state.OwnerObjectId);
        var newNotifications;
        User.on("value",data => {
            if(data.val()){       
                var currentPost;
                var ownerName = data.val().name;
                var Post = firebase.database().ref("Posts/" + this.state.postObjectId)
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
                    .then(()=>{
                        this.findPost(this.state.OwnerObjectId)
                    })
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
                        if(everyNotification.image == this.state.data.imageUrl &&
                            everyNotification.text.includes("liked your post.")    
                        ){
                            requiredImageIndex = ImageIndex
                        }
                        ImageIndex += 1;
                        return (everyNotification.image == this.state.data.imageUrl &&
                            everyNotification.text.includes("liked your post.")  )
                    } )
                    if(requiredNotification.length != 0){
                        var newList = newNotifications.slice(0,requiredImageIndex)
                        newList = newList.concat(newNotifications.slice(requiredImageIndex+1,newNotifications.length))
                        var newOne = {
                            image : this.state.data.imageUrl,
                            objectId : this.state.objectId,
                            text : this.state.user.userName + " and " + (currentLikes - 1)  + " other liked your post.",
                            uploadedDate : today.date,
                            uploadedTime : today.time
                        }
                        newList.unshift(newOne)
                        newNotifications = newList
                    }else{
                        var newOne = {
                            image : this.state.data.imageUrl,
                            objectId : this.state.objectId,
                            text : this.state.user.userName + " liked your post.",
                            uploadedDate : today.date,
                            uploadedTime : today.time
                        }
                        if(newNotifications == undefined){
                            newNotifications = []
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
    unlikeImage = async () => {
        this.setState({ waiting : true })
        var currentPost;
        var Post = await firebase.database().ref("Posts/" + this.state.postObjectId)
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
            Post.update({
                numLikes : currentLikes, likes : currentLikedBy
            })
            .then(()=>{
                this.findPost(this.state.OwnerObjectId)
            })
            .catch(err => {
                console.log(err)
                alert(err.message)
            })
        }
        this.setState({ waiting : false })
    }
    deleteAction = () => {
        this.setState({ waiting : true })
        var currentPosts;
        var currentPostNum;
        var User = firebase.database().ref("Users/" + this.state.OwnerObjectId)
        User.on("value",data => {
            if(data.val()){
                currentPostNum = data.val().numPosts
                currentPostNum -= 1
                currentPosts = data.val().posts
                var afterDeletion = currentPosts.slice(0,this.state.imageIndex)
                afterDeletion = afterDeletion.concat(currentPosts.slice(this.state.imageIndex+1,currentPosts.length))
                currentPosts = afterDeletion
            }
        })
        var Post = firebase.database().ref("Posts/" + this.state.postObjectId)
        Post.remove(err => {
            if(err){
                console.log(err);alert(err.message)
            }
        })
        if(currentPosts.length == 0){
            currentPosts = []
        }
        User.update({
            posts : currentPosts,numPosts : currentPostNum
        })
        .then(()=>{
            alert("Post Deleted Successfully!!!")
            this.props.navigation.replace("AccountScreen")
        })
        .catch(err => {
            console.log(err)
            alert(err.message)
        })
        this.setState({ waiting : false })
    }
    deletePost = () => {
        Alert.alert(
            "Delete Post ",
            `Are you sure , you want to delete this post?`,
            [
              {
                text : 'Cancel' , onPress : () => {}
              },
              {
                text : "Yes", onPress : () => {this.deleteAction()}
              }
            ]
          )
    }
    editPost = () => {
        if(!this.state.editPost){
            this.setState({ editPost : true })
        }
    }
    editAction = () => {
        this.setState({ editPost : false,waiting : true })
        if(this.state.caption !== this.state.data.caption){
            var Post = firebase.database().ref("Posts/" + this.state.postObjectId)
            Post.update({
                isEdited : true, caption : this.state.caption
            })
            .then(()=>{
                this.findPost(this.state.OwnerObjectId)
            })
            .catch(err => {
                console.log(err)
                alert(err.message)
            })
        }
        this.setState({ waiting : false })
    }
    addComment = () => {
        this.setState({ addComment : !(this.state.addComment) })
    }
    addCommentAction = async () => {
        if(this.state.newComment == ""){
            return
        }else if(!this.state.waiting) {
            this.setState({ waiting : true })
            var User = await firebase.database().ref("Users/" + this.state.OwnerObjectId)
            var numNewNotifications = 0,newNotifications = [];
             User.on("value",data => {
                if(data.val()){
                    var currentPost;
                    var Post = firebase.database().ref("Posts/" + this.state.postObjectId)
                    Post.on("value",data => {
                        if(data.val()){
                            currentPost = data.val()
                        }
                    })
                    var currentComments = currentPost.comment
                    var currentCommentsNum = currentPost.numComments
                    currentCommentsNum += 1
                    if(currentComments == undefined){
                        currentComments = []
                    } 
                    var today = this.returnTime()
                    var newComment = {
                        commentText : this.state.newComment,commentByUid : this.state.user.uid,commentByObjectId : this.state.objectId,
                        uploadedTime : today.time,uploadedDate : today.date,numReply : 0
                    }
                    currentComments.unshift(newComment)
                    Post.update({
                        comment : currentComments, numComments : currentCommentsNum
                    })
                    .then(()=>{
                        this.findPost(this.state.OwnerObjectId)
                        this.setState({ newComment : null,commentText : "" })
                    })
                    .catch(err => {
                        console.log(err)
                        alert(err.message)
                    })
                    numNewNotifications = data.val().numNewNotifications
                    numNewNotifications += 1
                    var today = this.returnTime()
                    newNotifications = data.val().newNotifications
                    var newOne = {
                        image : this.state.data.imageUrl,
                        objectId : this.state.objectId,
                        text : this.state.user.userName + " commented your post.",
                        uploadedDate : today.date,
                        uploadedTime : today.time
                    }
                    if(newNotifications == undefined){
                        newNotifications = []
                    }
                    newNotifications.unshift(newOne)
                    
                }
            })
            User.update({
                numNewNotifications : numNewNotifications,newNotifications : newNotifications
            })
            .then(()=>{
                this.setState({ waiting : false })
                return
            })
            .catch(err => { 
                console.log(err)
                alert(err.message)
            })
            this.setState({ waiting : false })
        }
    }
    replyComment = (commentIndex) => {
        this.props.navigation.navigate("ReplyComment",{
            user : this.state.user,owner : this.state.owner,ownerObjectId : this.state.OwnerObjectId,
            imageIndex : this.state.imageIndex,commentIndex : commentIndex,objectId : this.state.objectId,
            postObjectId : this.state.postObjectId,
        })
    }   
    deleteComment = (index) => {
        Alert.alert(
            "Delete Comment",
            "Are you sure, you want to delete this comment ?",
            [
                {
                    text : "Cancel",onPress : () => {}
                },{
                    text : "Ok", onPress : () => {this.deleteCommentAction(index)}
                }
            ]
        )
    }
    deleteCommentAction = async (index) => {
        this.setState({ waiting : true })
        var Owner = firebase.database().ref("Users/" + this.state.OwnerObjectId)
        await Owner.on("value",data => {
            if(data.val()){
                var currentPost;
                var Post = firebase.database().ref("Posts/" + this.state.postObjectId)
                Post.on("value",data => {
                    if(data.val()){
                        currentPost = data.val()
                    }
                })
                if(currentPost.comment != undefined){
                    var currentCommentList = currentPost.comment
                    var newCommentList = currentCommentList.slice(0,index)
                    newCommentList = newCommentList.concat(currentCommentList.slice(index+1,currentCommentList.length))
                    var currentCommentsNum =  currentPost.numComments 
                    currentCommentsNum -= 1
                    Post.update({
                        comment : newCommentList, numComments : currentCommentsNum
                    })
                    .then(()=>{
                        this.findPost(this.state.OwnerObjectId)
                    })
                    .catch(err => {
                        console.log(err)
                        alert(err.message)
                    })
                }                
            }
        })
        this.setState({ waiting : false })
    }
    render() {
        if(this.state.initialWaiting){
            return(
                <View style={styles.container}>
                    <Spinner style={{marginTop : "20%"}} color="green" />
                    <Text style={{marginLeft : "40%",marginTop : "-10%"}}>Please Wait</Text>
                </View>
            )
        }else{    
            return (
                <View style={styles.container}> 
                    <Animated.View  style={{
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
                        }}
                    >
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
                        <Animated.View style={{ position : "absolute", left : width * 0.03 ,marginTop : -30}}>
                            <TouchableOpacity style={{marginLeft : 20}} onPress={() => this.props.navigation.goBack()  }>
                                <Ionicons name="md-arrow-round-back" size={30} color="white" />
                            </TouchableOpacity> 
                        </Animated.View>
                        <Animated.View style={{ position : "absolute", left : width * 0.2 ,marginTop : -30}}>
                            <Avatar
                                size={50}
                                rounded
                                source={ this.state.user.userProfile  ? { uri : this.state.user.userProfile } : 
                                require("../../../assets/account.png") }
                            />
                        </Animated.View>
                        <Animated.View style={{ flexDirection : "row",position : "absolute",left : width * 0.35,
                            justifyContent : "center",alignItems : "center",marginTop : -25,}}>
                            <Text style={{fontSize : 24,fontWeight : "bold",color : "white"}}> {this.state.user.userName} </Text>
                        </Animated.View>
                    </Animated.View>
                </Animated.View>
                    <Animated.ScrollView
                        bounces={false}
                        style={[{paddingTop : HEADER_HEIGHT }]}
                        scrollEventThrottle={16}
                            onScroll={Animated.event([
                            {
                                nativeEvent : { contentOffset : {y : this.scrollY } }
                            }
                    ])}>
                        <KeyboardAvoidingView behavior="padding" >
                            <Card style={{width : width - 10,backgroundColor : "rgba(8,8,8,0.95)"}}>
                                <CardItem style={{backgroundColor : "rgba(8,8,8,0.95)"}}>
                                    <Left>
                                        <Thumbnail source={{ uri : this.state.owner.userProfile }} />
                                        <Body>
                                            <Text style={{color : "white"}}> {this.state.owner.userName} </Text>
                                            <Text style={STYLES.specialColor} note> {this.state.owner.name} </Text>
                                        </Body>
                                        {this.state.editPost ?
                                            <Right>
                                                <TouchableOpacity onPress={()=>{this.editAction()}} style={{ height : 50,
                                                    width : 60,alignItems : "center",justifyContent : "center",backgroundColor : "#F4C724"  }}>
                                                    <Text> Edit </Text>
                                                </TouchableOpacity>
                                            </Right> : <Right /> }
                                        { !this.state.editPost && this.state.user.uid === this.state.ownerUid ?
                                            <Body>
                                                <TouchableOpacity onPress={()=>{this.editPost()}} style={{ marginLeft : "-30%" ,backgroundColor : "#F4C724",height : 40,width : 50,alignItems : "center",justifyContent : "center" }}>
                                                    <Entypo name="pencil" color="white" size={30} /> 
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={()=>{this.deletePost()}} style={{ position : "absolute",right : 0, backgroundColor : "#BA2F16",height : 40,width : 50,alignItems : "center",justifyContent : "center" }}>
                                                    <Entypo name="trash" color="white" size={30} /> 
                                                </TouchableOpacity>
                                            </Body> : <View /> }
                                    </Left>
                                </CardItem>
                                <CardItem style={{backgroundColor : "rgba(8,8,8,0.95)"}} cardBody>
                                    <Image source={{ uri : this.state.data.imageUrl }} style={{ height : 430, width: null, flex: 1 }} />
                                </CardItem>

                                <CardItem style={{backgroundColor : "rgba(8,8,8,0.95)"}} style={{borderBottomColor : "black",borderBottomWidth : 0.8}}>
                                <Left>
                                {/* <TouchableOpacity onPress={()=>{this.unlikeImage()}}>
                                                <AntDesign name="heart" color="red" size={30}  />
                                            </TouchableOpacity>
                                             */}
                                        {( this.state.data.likes && this.state.data.likes.filter( eachLike => {
                                            return eachLike.uid == this.state.user.uid
                                        } ).length != 0 )  ?
                                            <TouchableOpacity onPress={()=>{this.unlikeImage()}}>
                                                <Avatar
                                                size={27}
                                                rounded
                                                source={ require("../../../assets/pumpkin.jpg") }
                                                />
                                          </TouchableOpacity>
                                            : 
                                            <TouchableOpacity onPress={()=>{this.likeImage()}}>
                                                <AntDesign name="hearto" color="black" size={30}  />
                                            </TouchableOpacity>
                                        
                                        }
                                </Left>
                                    <TouchableOpacity  onPress={()=>{this.addComment()}} style={{marginLeft : "-20%"}}>
                                        <Body style={{flexDirection : "row"}}> 
                                            <Text style={{fontSize : 25}}>{this.state.data.numComments}</Text>
                                            <FontAwesome style={{marginLeft : "10%"}} name="comment" color="black" size={30} />
                                        </Body>
                                    </TouchableOpacity>
                                    <Right>
                                        <Text> {this.whatToWrite(this.state.data.uploadedOnDate,this.state.data.uploadedOnTime)} </Text>
                                    </Right>
                                </CardItem>
                                <CardItem style={{backgroundColor : "rgba(8,8,8,0.95)"}}>
                                    <TouchableOpacity onPress={()=>{this.props.navigation.navigate("LikedBy",{
                                        data : this.state.data,objectId : this.state.objectId,likedBy : this.state.likedBy,user : this.state.user,
                                        ownerData : this.state.owner
                                    })}}>
                                        <Left>
                                            {this.state.data.likeStatus ? 
                                            <Text style={{color : "white"}}> {this.state.data.likeStatus} </Text>: 
                                            <Text style={{color : "white"}}>Liked by {this.state.data.numLikes} </Text> }
                                        </Left>
                                    </TouchableOpacity>
                                    {this.state.data.isEdited ?
                                            <Right>
                                                <Text style={STYLES.specialColor}>Edited</Text>    
                                            </Right>  : <Right /> } 
                                </CardItem>
                                {this.state.editPost ?
                                    <Form style={{backgroundColor : "rgba(8,8,8,0.95)",borderWidth : 1,borderColor : "white" }}>
                                        <Textarea rowSpan={3} bordered placeholder="Caption" 
                                            placeholderTextColor="white"
                                            style={{borderColor : "black",marginBottom : 30,color : "white"}}
                                            onChangeText={(caption)=>{this.setState({ caption })}} value={this.state.caption} />
                                    </Form>
                                :
                                    <CardItem style={{backgroundColor : "rgba(8,8,8,0.95)"}}>
                                        <Text style={STYLES.specialColor}> {this.state.data.caption} </Text> 
                                    </CardItem> }
                                {this.state.addComment ? 
                                    <CardItem style={{borderTopWidth : 1,borderBottomWidth : 1,borderBottomColor : "white",
                                        borderTopColor : "white",flexDirection : "row",
                                        width : "100%",backgroundColor : "rgba(8,8,8,0.95)"}}>
                                        <Thumbnail style={{marginRight : "5%"}}  source={{ uri : this.state.user.userProfile }} />
                                        <Input style={{borderRadius : 5,borderWidth : 1,borderColor : "white",color : "white"}} 
                                            placeholderTextColor="white"
                                            onChangeText={newComment => {this.setState({ newComment })}}
                                            value={this.state.newComment} placeholder="Add a new comment" />
                                        <TouchableOpacity onPress={()=>{this.addCommentAction()}} style={{marginLeft : "2%",borderRadius : 100,width : 40,backgroundColor : "#2C3335",height : 50,justifyContent : "center",alignItems : "center"}}>
                                            <FontAwesome name="arrow-right" color="white" size={30} />
                                        </TouchableOpacity>
                                    </CardItem>
                                : <View /> }
                                <List style={{borderTopWidth : 1,borderTopColor : "black"}}>
                                    {this.state.comments.map( (item,index) => (
                                        <ListItem key={index} thumbnail>
                                            <Left>
                                                <TouchableOpacity onPress={()=>{this.seeAccount(item.commentByUid)}}>
                                                    <Thumbnail source={{ uri: item.commentByUserProfile }} />
                                                </TouchableOpacity>
                                            </Left>
                                            <Body>
                                                <TouchableOpacity onPress={()=>{this.replyComment(index)}}>
                                                    <Text style={{color : "white"}} note numberOfLines={1}> {item.commentByName} </Text>
                                                    <Text style={{color : "white"}}> {item.commentText}  </Text>
                                                </TouchableOpacity>
                                                <CardItem style={{backgroundColor : "rgba(8,8,8,0.95)"}}>
                                                    <TouchableOpacity style={{marginLeft : "15%",flexDirection : "row",backgroundColor : "#2C3335",height : 30,width : 45,alignItems : "center",justifyContent : "center"}} onPress={()=>{this.replyComment(index)}}>
                                                        <Text style={{color : "white"}}> {item.numReply} </Text>
                                                        <FontAwesome name="comments" size={20} color="white" />
                                                    </TouchableOpacity>     
                                                    {item.commentByUid == this.state.user.uid ?
                                                        <Left>
                                                            <TouchableOpacity onPress={()=>{this.deleteComment(index)}} style={{ marginLeft : "15%", backgroundColor : "#BA2F16",height : 30,width : 40,alignItems : "center",justifyContent : "center" }}>
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
                            </KeyboardAvoidingView>
                        <View style={{height : 100,backgroundColor : "rgba(8,8,8,0.95)"}} />
                    </Animated.ScrollView>
                </View>
           );
        }
    }
}

const styles = StyleSheet.create({
    container : {
        minHeight : Dimensions.get("window").height,
        backgroundColor: 'rgba(8,8,8,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    username : {
        position : "absolute",top : 40,color : "white",left : 10,fontSize : 20
    },
})