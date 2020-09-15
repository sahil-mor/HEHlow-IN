import React from 'react';
import { StyleSheet, Text, View,Dimensions,Platform,StatusBar,TouchableOpacity} from 'react-native';
import { Avatar } from 'react-native-elements';
import {FontAwesome} from '@expo/vector-icons'
import Animated from 'react-native-reanimated'
import dateformat from 'dateformat'
import * as firebase from 'firebase'
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';
import {Ionicons} from '@expo/vector-icons'
import {  ListItem, Thumbnail, Left, Body, Input, Item  , Spinner } from 'native-base';

const {width} = Dimensions.get("window")
const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight

import STYLES from '../../styles/styles'
import config from "../config"

export class MessageScreen extends React.Component{
    constructor(props){
        super(props);
        this.scrollY = new Animated.Value(0)
        this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
        this.headerY = Animated.interpolate(this.diffClampScrollY,{
          inputRange : [0, HEADER_HEIGHT],
          outputRange : [0,-HEADER_HEIGHT]
        })
        this.state = {
          email : "",name : "",user : null,userId : null,updating : false,
          messageList : [],objectId : null,user : null,searched : [],searchText : "",waiting : true
        }
    }
    callFunction = (toUpdate) => {
        if(toUpdate){
          this.setState({ updating : true })
        } 
        var objectId = this.props.route.params.params.objectId
        if(objectId){
            this.findMessageList(objectId)
        }
    }
    componentDidMount(){
        this.callFunction(false)
    }
    findMessageList = objectId => {
        var User = firebase.database().ref("Users/" + objectId )
        User.on("value",data => {
            if(data.val()){
                var messageList = data.val().messageList
                if(messageList == undefined){
                    messageList = []
                }
                this.setState({ objectId,  messageList, user : data.val(),waiting : false,updating : false })
            }
        })
    }
    seeAccount = accountId => {
        if(this.state.user.uid === accountId){
            this.props.navigation.navigate("Profile")
        }else{
            this.props.navigation.navigate("SendMessage",{ params : { uid : accountId } })
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
                    }else
                        return ( Math.abs((currentHour.slice(0,index1) - uploadedHour.slice(0,index2) )) + " h" )
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
    searchedMessages = (searchText) => {
        if(searchText != ""){
            searchText = searchText.toUpperCase()
            if(this.state.messageList != undefined){
                var searched = this.state.messageList.filter(eachOne => {
                    return eachOne.name.toUpperCase().includes(searchText) || eachOne.userName.toUpperCase().includes(searchText) 
                })
                this.setState({ searched, searchText : "" })
            }
        }
    }
    onSwipe(gestureName, gestureState) {
        const {SWIPE_UP, SWIPE_DOWN, SWIPE_LEFT, SWIPE_RIGHT} = swipeDirections;
        this.setState({gestureName: gestureName});
        switch (gestureName) {
            case SWIPE_UP:
            break;
            case SWIPE_DOWN:
                this.callFunction(true)
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
                            <Animated.View style={{width : width*0.2,marginLeft : 10,marginTop : -30}}>
                                <TouchableOpacity style={{marginLeft : 20,}} onPress={() => {this.props.navigation.goBack()}  }>
                                    <Ionicons name="md-arrow-round-back" size={30} color="white" />
                                </TouchableOpacity>
                            </Animated.View>
                            <Animated.View style={{flex : 1,marginLeft : -20,marginTop : -30}}>
                                <Avatar
                                    size={50}
                                    rounded
                                    source={ this.state.user.userProfile ? { uri : this.state.user.userProfile } : 
                                    require("../../../assets/account.png") }
                                />
                            </Animated.View>
                            <Animated.View style={{flex : 5,flexDirection : "row",justifyContent : "center",alignItems : "center"
                            ,marginTop : -25,marginLeft : -170}}>
                                <Text style={{color : "white",fontSize : 25,fontWeight : "bold"}}> {this.state.user.userName} </Text>   
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
                        {this.state.updating  ? 
                            <View style={STYLES.updating}>
                                <Text style={{fontWeight : "bold",fontSize : 18}}>UPDATING </Text>
                                <Spinner style={{marginLeft : 10}} color="green" size="small" />
                            </View>
                        : null}
                        <View style={{ marginTop : 10,marginBottom : 20 }}>
                            <Item style={{flexDirection : "row",width : width - 20,marginLeft : 10}}>
                                <Input style={{flex : 6,color : "white"}} 
                                    onChangeText={searchText => { this.setState({ searchText }) }}
                                    value={this.state.searchText} placeholder="Search" 
                                    placeholderTextColor="white"
                                />
                                <TouchableOpacity onPress={()=>{this.searchedMessages(this.state.searchText)}  } style={{ flex : 1, width : 40,height : 40,
                                    backgroundColor : "#2C3335",borderRadius : 10, alignItems : "center",justifyContent : "center"}}>
                                    <FontAwesome name="search" size={30} color="white" />
                                </TouchableOpacity>
                            </Item>
                        </View>
                        {this.state.searched.map( (item,index) => (
                            <ListItem key={index} onPress={()=>{ this.seeAccount(item.userUid) }} thumbnail>
                            <Left>
                                <Thumbnail style={{marginTop : "-15%"}} source={{ uri: item.userProfile }} />
                            </Left>
                            <Body>
                                <View style={{flexDirection : "row"}}>
                                    <Text style={styles.usernameText} > {item.userName} </Text>
                                    <Text note numberOfLines={1} style={styles.timeText}> {this.whatToWrite(item.date,item.time)} </Text> 
                                
                                </View>
                                {item.lastMsgText.length > 35 ?
                                    <Text note numberOfLines={1} style={styles.messageColor} > {item.lastMsgText.slice(0,35)} ... </Text> :
                                    <Text note numberOfLines={1} style={styles.messageColor} > {item.lastMsgText} </Text> 
                                    
                                }
                            </Body>
                        </ListItem>
                        ) )}
                        {this.state.messageList.map( (item,index) => (
                            <ListItem key={index}
                                style={ index == this.state.messageList.length - 1 ? { marginBottom : 110 } : null }
                                onPress={()=>{ this.seeAccount(item.userUid) }} thumbnail>
                            <Left>
                                <Thumbnail style={{marginTop : "-15%"}} source={{ uri: item.userProfile }} />
                            </Left>
                            <Body>
                                <View style={{flexDirection : "row"}}>
                                    <Text style={styles.usernameText}> {item.userName} </Text>
                                    <Text note numberOfLines={1} style={styles.timeText}> {this.whatToWrite(item.date,item.time)} </Text> 
                                
                                </View>
                                {item.lastMsgText.length > 35 ?
                                    <Text note numberOfLines={1} style={styles.messageColor}> {item.lastMsgText.slice(0,35)} ... </Text> :
                                    <Text note numberOfLines={1} style={styles.messageColor}> {item.lastMsgText} </Text> 
                                }
                            </Body>
                        </ListItem>
                        ) )}
                    </Animated.ScrollView>
                </GestureRecognizer>
            </View>
        )
    }
}


const styles = StyleSheet.create({
    container : {
        flex : 1,backgroundColor : "#fff"
    },
    messageColor : {
        color : "rgba(245,245,245,1)"
    },
    timeText : {
        position : "absolute",right : 25,color : "white"
    },
    usernameText : {
        color : "white",fontWeight : "bold",fontSize : 20
    }
})