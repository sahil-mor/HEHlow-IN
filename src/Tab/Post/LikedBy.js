import React, { Component } from 'react';
import { Image,View,StyleSheet,TouchableOpacity,Alert,KeyboardAvoidingView,
    Dimensions,StatusBar,Text,FlatList } from 'react-native';

import {AntDesign,Ionicons,FontAwesome,Entypo} from '@expo/vector-icons'
import { Avatar } from 'react-native-elements';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import {Spinner, List, ListItem, Thumbnail, Left, Body, Right} from 'native-base'
import Animated from 'react-native-reanimated'
const {width} = Dimensions.get("window")
const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight
import * as firebase from 'firebase'
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';

import STYLES from '../../styles/styles'

export class LikedBy extends React.Component{
    constructor(props){
        super(props);
        this.scrollY = new Animated.Value(0)
        this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
        this.headerY = Animated.interpolate(this.diffClampScrollY,{
          inputRange : [0, HEADER_HEIGHT],
          outputRange : [0,-HEADER_HEIGHT]
        })
        this.state = {
          email : "",name : "",user : null,userId : null,objectId : "",ownerData : null,
          timelinePosts : null,waiting : true,search : "",foundUsers : [],search : "",
        }
    }
    componentDidMount(){
        const data =  this.props.route.params.data
        const ownerData =  this.props.route.params.ownerData
        const objectId =  this.props.route.params.objectId
        var likedBy =  this.props.route.params.likedBy
        const user =  this.props.route.params.user
        if(data && objectId && likedBy && user){
            this.findLikedBy(likedBy)
            this.setState({ data ,objectId, user ,ownerData  })
        }
    }
    findLikedBy = async (ids) => {
        var list = []
        await ids.forEach(eachOne => {
            var user = firebase.database().ref("Users/" + eachOne.objectId)
            user.on("value",data => {
                if(data.val()){
                    var newOne = eachOne
                    newOne.name = data.val().name;
                    newOne.userName = data.val().userName;
                    newOne.userProfile = data.val().userProfile
                    list.push(newOne)
                }
            })
        })
        this.setState({ likedBy : list ,waiting : false})
    }
    seeAccount = accountId => {
        if(this.state.user.uid === accountId){
            this.props.navigation.navigate("Profile")
        }else{
            this.props.navigation.navigate("SeeOtherAccount",{ params : { uid : accountId }})
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
            this.callFunction(this.state.userId)
            break;
          case SWIPE_LEFT:
            // this.setState({backgroundColor: 'blue'});
            break;
          case SWIPE_RIGHT:
            // this.setState({backgroundColor: 'yellow'});
            this.props.navigation.goBack()
            break;
        }
    }
    render(){
        if(this.state.waiting){
            return( 
              <View style={[STYLES.generalPage,{justifyContent : "center",alignItems : "center"}]}>
                <Spinner size={"large"} color="red"  />
             </View>
            )
          }
          const config = {
            velocityThreshold: 0.3,
            directionalOffsetThreshold: 80
        };
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
                            <Animated.View style={{ position : "absolute", left : width * 0.03 ,marginTop : -30}}>
                                <TouchableOpacity style={{marginLeft : 20}} onPress={() => this.props.navigation.goBack()  }>
                                    <Ionicons name="md-arrow-round-back" size={30} color="white" />
                                </TouchableOpacity> 
                            </Animated.View>
                            <Animated.View style={{ position : "absolute", left : width * 0.18 ,marginTop : -30}}>
                                <Avatar
                                    size={50}
                                    rounded
                                    source={ this.state.data.imageUrl  ? { uri : this.state.data.imageUrl } : 
                                    require("../../../assets/account.png") }
                                />
                            </Animated.View>
                            <Animated.View style={{ flexDirection : "row",position : "absolute",left : width * 0.35,
                                justifyContent : "center",alignItems : "center",marginTop : -25,}}>
                                <Text style={{fontSize : 24,fontWeight : "bold",color : "white"}}> {this.state.ownerData.userName} </Text>
                            </Animated.View>
                    </Animated.View>
                    <Animated.ScrollView
                        bounces={false}
                        style={[{paddingTop : HEADER_HEIGHT-20 },styles.postcontainer]}
                        scrollEventThrottle={16}
                        onScroll={Animated.event([
                        {
                            nativeEvent : { contentOffset : {y : this.scrollY } }
                        }
                        ])}
                    >
                        <View>
                            <List>
                                {this.state.likedBy.map( (item,index) => (
                                    <ListItem key={index} onPress={()=>{ this.seeAccount(item.uid) }} thumbnail
                                        style={ index == this.state.likedBy.length - 1 ? { marginBottom : 100 } : null }
                                    >
                                        <Left>
                                            <Thumbnail  source={{ uri: item.userProfile }} />
                                        </Left>
                                        <Body>
                                            <Text style={{color : "white"}}> {item.userName} </Text>
                                            <Text style={STYLES.specialColor} note numberOfLines={1}> {item.name} </Text>
                                        </Body>
                                    </ListItem>
                                ) )}
                            </List>
                            <View style={{height : 10}} />
                        </View>
                    </Animated.ScrollView>
                </GestureRecognizer>
            </View>
        )
    }
}

const styles = StyleSheet.create({

})