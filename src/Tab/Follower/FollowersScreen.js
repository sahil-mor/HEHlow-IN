import React from 'react'
import { StyleSheet, Text,Dimensions, View ,TouchableOpacity,StatusBar} from 'react-native';
import * as firebase from 'firebase'
import { Button, ListItem, Left, Body,Spinner,Item,Input} from 'native-base'
import { Avatar } from 'react-native-elements';
import {Ionicons,FontAwesome} from '@expo/vector-icons'
import Animated from 'react-native-reanimated'
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';

import STYLES from '../../styles/styles'
import config from "../config"

const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight
const {width,height} = Dimensions.get("window")

export class FollowersScreen extends React.Component{
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
          email : "",name : "",user : null,userId : null,firstTime : true,updating : false,
          objectIdUser : null,followers : [],search : "",waiting : true,foundUsers:[]
        }
    }
    callFunction = (uid,toUpdate) => {
        if(toUpdate){
          this.setState({ updating : true })
        } 
        this.findUser(uid)
        var toFindFollowersOf = this.props.route.params.params.uid
        if(toFindFollowersOf != uid){
            this.findFollowers(toFindFollowersOf)
        }
    }
    componentDidMount(){
        firebase.auth().onAuthStateChanged(authenticate => {
            if(authenticate){
                this.callFunction(authenticate.uid,false)
                this.setState({ name : authenticate.displayName,email : authenticate.email,userId : authenticate.uid })
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
                    var followers = matchedUser[0].followers.splice(1,matchedUser[0].followers.length) 
                    var updatedFollowerList = []
                    followers.forEach( follower => {
                        var F = firebase.database().ref("Users/" + follower.objectId)
                        F.on("value",data => {
                        if(data.val()){
                            updatedFollowerList.push(data.val())
                        }
                        })
                    } )
                    this.setState({ user : matchedUser[0], objectIdUser : keys[matchedIndex] , followers : updatedFollowerList,
                        followersOf : matchedUser[0],waiting : false,updating : false })
                }
            }else{
                this.props.navigation.replace("Register")
            }
        })
    }
    findFollowers = uid => {
        var users = firebase.database().ref("Users")
        users.on("value",data => {
            if(data.val()){
                var Users = Object.values(data.val())
                var matchedUser = Users.filter(u => {
                    return uid === u.uid
                })
                if(matchedUser.length == 1){
                    var followers = matchedUser[0].followers.splice(1,matchedUser[0].followers.length) 
                    var updatedFollowerList = []
                    followers.forEach( follower => {
                    var F = firebase.database().ref("Users/" + follower.objectId)
                    F.on("value",data => {
                        if(data.val()){
                        updatedFollowerList.push(data.val())
                        }
                    })
                    } )
                    this.setState({ followers : updatedFollowerList ,followersOf : matchedUser[0] })
                }
            }else{
                this.props.navigation.replace("Register")
            }
        })
    }
    seeAccount = accountId => {
        this.props.navigation.navigate("SeeOtherAccount",{ params : { uid : accountId }} )
    }
    search = Search => {
        if(Search != ""){
            var ToSearch = Search.toUpperCase()
            var matchedUsers = this.state.followers.filter(u => {
                var username = u.userName.toUpperCase()
                var name = u.name.toUpperCase()
                return ( (username.includes(ToSearch) || name.includes(ToSearch)) )
                })
            this.setState({ foundUsers : matchedUsers,search : "" })
        }else{
            this.setState({ foundUsers : [] })
        }
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
            break;
          case SWIPE_RIGHT:
            // this.setState({backgroundColor: 'yellow'});
            break;
        }
      }
    render(){
        if(this.state.waiting){
            return(
                <View style={[STYLES.generalPage,{ flex : 1, justifyContent : "center",alignItems : 'center' }]}>
                    <Spinner color="red" size="large" />
                </View>
            )
        }    
        return(
            <View style={[STYLES.generalPage,{ justifyContent : "center",alignItems : "center",minHeight : height }]}>
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
                            <TouchableOpacity style={{marginLeft : 20}} onPress={() => this.props.navigation.goBack()  }>
                                <Ionicons name="md-arrow-round-back" size={30} color="white" />
                            </TouchableOpacity> 
                        </Animated.View>
                        <Animated.View style={{flex : 1,marginTop : -30,marginLeft : -50}}>
                            <Avatar
                                size={50}
                                rounded
                                showEditButton='true'
                                source={ this.state.followersOf.userProfile ? {  uri : this.state.followersOf.userProfile }
                                : {uri : "https://i.ibb.co/MV9DLp4/account.png"} }
                            />
                        </Animated.View>
                        <Animated.View style={{flex : 2,flexDirection : "row",justifyContent : "center",marginTop : -25}}>
                            <Text style={{fontSize : 22,fontWeight : "bold",color : "white",marginLeft : -160}}> Followers  </Text>
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
                        ])}
                    >
                        {this.state.updating  ? 
                            <View style={STYLES.updating}>
                                <Text style={{fontWeight : "bold",fontSize : 18}}>UPDATING </Text>
                                <Spinner style={{marginLeft : 10}} color="green" size="small" />
                            </View>
                        : null}
                        <View style={styles.form}>
                            <Item inlineLabel style={{width : "90%",marginLeft : "5%"}} >
                                <Input value={this.state.search} 
                                    onChangeText={(search)=>{ this.setState({ search }) }} 
                                    style={{flex : 7,color : "white"}} placeholder="Search Username" 
                                    placeholderTextColor="rgba(245,245,245,0.75)"
                                />
                                <Button warning style={{flex : 1}} onPress={()=>{this.search(this.state.search)}} rounded >
                                    <FontAwesome name="search" color="white" size={20} />
                                </Button>
                            </Item>
                            { this.state.foundUsers.map( (item,index) => (
                                <ListItem 
                                    style={ {marginTop : 20} }
                                    key={index} thumbnail
                                    onPress={()=>{this.seeAccount(item.uid)}}
                                >
                                    <Left>
                                        <Avatar
                                            size={50}
                                            rounded
                                            showEditButton='true'
                                            source={ item.userProfile ? {  uri : item.userProfile } : {uri : "https://i.ibb.co/MV9DLp4/account.png"} }
                                        />
                                    </Left>
                                    <Body>
                                        <Text style={{color : "white"}}> {item.name} </Text>
                                        <Text style={{color : "white"}} note numberOfLines={1}> {item.userName} </Text>
                                    </Body>
                                </ListItem>
                            ) ) }
                        </View>
                        <View style={styles.foundData}>
                            <Text style={{color : "white",fontWeight : "bold",fontSize : 20,marginLeft : 30,textDecorationLine : "underline"}}>
                                Followers
                            </Text>
                            { this.state.followers.map( (item,index) => (
                                <ListItem 
                                    onPress={()=>{alert("ehlo")}} style={ [index == this.state.followers.length - 1 ? styles.eachItem : {marginBottom : 10},{marginTop : 20}] }
                                    key={index} onPress={()=>{this.seeAccount(item.uid)}} thumbnail>
                                    <Left>
                                        <Avatar
                                            size={50}
                                            rounded
                                            showEditButton='true'
                                            source={ item.userProfile ? {  uri : item.userProfile } : {uri : "https://i.ibb.co/MV9DLp4/account.png"} }
                                        />
                                    </Left>
                                    <Body>
                                        <Text style={{color : "white"}}> {item.name} </Text>
                                        <Text style={{color : "white"}} note numberOfLines={1}> {item.userName} </Text>
                                    </Body>
                                </ListItem>
                            ) ) }
                        </View>
                    </Animated.ScrollView>
                </GestureRecognizer>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    addfavstory:{
        width:50,
        height:50,
        padding:20,
        borderWidth:2,
        borderRadius : 100,
        borderColor:'rgba(245,245,245,0.75)',
        width : "100%"
    },
    foundData : {
        flex : 1,width : width,
    },
    eachItem : {
        marginBottom : 110
    },
    form : {
        marginTop : 0,marginBottom : 20
    }
})