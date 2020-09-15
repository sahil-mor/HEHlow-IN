import React from 'react';
import { StyleSheet, Text, View,TextInput,Dimensions,Platform,StatusBar} from 'react-native';
import * as firebase from 'firebase'
import { Avatar } from 'react-native-elements';
import {FontAwesome} from '@expo/vector-icons'
import {Spinner,ListItem, Left, Body, Thumbnail} from 'native-base'

import Animated from 'react-native-reanimated'
import STYLES from '../../styles/styles'

const {width,height} = Dimensions.get("window")

const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight

export class SearchScreen extends React.Component{
    constructor(props){
        super(props);
        this.scrollY = new Animated.Value(0)
        this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
        this.headerY = Animated.interpolate(this.diffClampScrollY,{
        inputRange : [0, HEADER_HEIGHT],
        outputRange : [0,-HEADER_HEIGHT]
        })
        this.state = {
          email : "",name : "",user : {},userId : null,calledOnce : false,search : "",foundUsers : [],waiting : true
        }
    }
    componentDidMount(){
        firebase.auth().onAuthStateChanged(authenticate => {
            if(authenticate){
                this.findUser(authenticate.uid)
                var searchName = this.props.route.params.params.searchName
                this.search(searchName)
                this.setState({ waiting : false,search : searchName,
                    name : authenticate.displayName,email : authenticate.email,userId : authenticate.uid,calledOnce : true })
            }else{
                this.props.navigation.replace("Signin")
            }
        })
    }
    findUser = uid => {
        var users = firebase.database().ref("Users")
        users.on("value",data => {
        if(data.val()){
            var Users = Object.values(data.val())
            var matchedUser = Users.filter(u => {
            return uid === u.uid
            })
            if(matchedUser.length == 1){
            this.setState({ user : matchedUser[0] })
            }
        }else{
            this.props.navigation.replace("Signup")
        }
        })
    }
    search = Search => {
        if(Search != ""){
            var users = firebase.database().ref("Users")
            users.on("value",data => {
                if(data.val()){
                    var ToSearch = Search.toUpperCase()
                    var Users = Object.values(data.val())
                    var matchedUsers = Users.filter(u => {
                        if( !u.hasOwnProperty('userName') ){
                            return
                        }
                        var username = u.userName.toUpperCase()
                        var name = u.name.toUpperCase()
                        return ( (username.includes(ToSearch) || name.includes(ToSearch)) && u.uid != this.state.userId )
                    })
                    this.setState({ foundUsers : matchedUsers })
                }else{
                    this.props.navigation.goBack()
                }
            })
        }else{
            this.setState({ foundUsers : [] })
        }
    }
    render(){
        if(this.state.waiting){
            return(
                <View style={[STYLES.generalPage,{ justifyContent : "center",alignItems : "center" }]}>
                    <Spinner name="red" size="large" color="white" />
                </View>
            )
        }
        return(
            <View style={[{flex : 1, backgroundColor : "lightgrey",justifyContent : "center",alignItems : "center"},STYLES.generalPage]}>
                <Animated.View style={{
                    position : "absolute",
                    left : 0,
                    right : 0,
                    top : 0,
                    height : HEADER_HEIGHT,
                    zIndex : 1000,
                    elevation : 1000,
                    transform: [ { translateY : this.headerY }],
                    alignItems : "center",justifyContent : "center",
                    paddingTop : StatusBar.currentHeight,
                    flexDirection : "column"
                }} >
                     <Animated.View style={{backgroundColor : "white",height : 25,  position : "absolute",
                        left : 0,
                        right : 0,
                        top : 0,}} 
                    />
                    <Animated.View style={{position : "absolute",
                        left : 0,
                        right : 0,
                        top : 25,
                        height : HEADER_HEIGHT-25,
                        backgroundColor : '#362c2b',
                        width : "100%",
                        zIndex : 1000,
                        elevation : 1000,
                        transform: [ { translateY : this.headerY }],
                        alignItems : "center",justifyContent : "center",
                        paddingTop : StatusBar.currentHeight,
                        flexDirection : "row"}}
                    >
                        <Animated.View style={{flex : 1,marginLeft : 20,marginTop : -25}}>
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
                                style={[STYLES.textInput,{flex : 2}]}
                                placeholderTextColor="black" 
                                value={this.state.search} onChangeText={ search => { this.setState({ search }) } }
                            />
                            <FontAwesome style={{marginRight : 20}} onPress={() => {this.search(this.state.search)} } name="search" size={30} color="white" />
                        </Animated.View>
                    </Animated.View>
                </Animated.View>
                <Animated.ScrollView
                    bounces={false}
                    style={[{paddingTop : HEADER_HEIGHT,width : width}]}
                    scrollEventThrottle={16}
                    onScroll={Animated.event([
                    {
                        nativeEvent : { contentOffset : {y : this.scrollY } }
                    }
                ])}>
                    <View style={styles.foundData}>
                        { this.state.foundUsers.map( (item,index) => (
                            <ListItem style={ index == this.state.foundUsers.length - 1 ? styles.eachItem : {marginBottom : 10} } key={index} 
                                onPress={()=>{this.props.navigation.navigate("SeeOtherAccount",{ params : { uid : item.uid } })}}
                             thumbnail>
                                <Left>
                                    <Avatar
                                        size={60}
                                        rounded
                                        source={ item.userProfile ? { uri : item.userProfile} : 
                                        require("../../../assets/account.png") }
                                    />
                                </Left>
                                <Body>
                                    <Text style={{color : "white"}}> {item.name} </Text>
                                    <Text style={{color : "white"}} note numberOfLines={1}> {item.userName} </Text>
                                </Body>
                            </ListItem>
                        ) ) }
                        {this.state.foundUsers.length == 0 ?
                            <View style={{alignItems : "center",justifyContent : "center",height : height - HEADER_HEIGHT - 50}}>
                                <Text style={{color : "white",fontWeight : "bold",fontSize : 20}}> NO DATA FOUND </Text>
                            </View>
                        : null }
                    </View>
                </Animated.ScrollView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    header : {
        flexDirection : "row",marginTop : 20,backgroundColor : "red",borderColor : "white",borderWidth : 2,height : 70
    },
    foundData : {
        flex : 1,width : "100%",marginTop : 10
    },
    eachItem : {
        marginBottom : 110
    }
})