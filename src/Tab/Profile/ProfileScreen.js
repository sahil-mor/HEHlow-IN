import React from 'react';
import { StyleSheet, Text,Dimensions, View ,TouchableOpacity,StatusBar,Image} from 'react-native';
import { Avatar } from 'react-native-elements';

import * as firebase from 'firebase'
import {Spinner} from 'native-base'
import {AntDesign,Entypo,MaterialCommunityIcons} from '@expo/vector-icons'
import {TapGestureHandler,State} from 'react-native-gesture-handler'
import Animated,{Easing,Transition, Transitioning} from 'react-native-reanimated'

const {Value,event,block,cond,eq,set,Clock,startClock,stopClock,
  debug,timing,clockRunning,interpolate,Extrapolate,concat} = Animated
const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight

import STYLES from '../../styles/styles'
import Tab from './imagesGrid/Tab'
const {width,height} = Dimensions.get("window")

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

export  class ProfileScreen extends React.Component{
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
        selectedTab : 0,email : "",name : "",user : null,userId : null,matchedIndex : null,key : null,
        profileIcon : true,pictureIcon : false,profileImages : [], showImages : [],posts : [],waiting : true
      }
    }
    componentDidMount(){
        firebase.auth().onAuthStateChanged(authenticate => {
            if(authenticate){
                this.findUser(authenticate.uid)
                this.setState({ name : authenticate.displayName,email : authenticate.email,
                userId : authenticate.uid,})
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
    findUser = (uid) => {
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
              var posts = []
              if(matchedUser[0].posts != undefined){
                matchedUser[0].posts.forEach( eachPost => {
                  var Post = firebase.database().ref("Posts/" + eachPost.postObjectId )
                  Post.on("value",data=>{
                    if(data.val()){
                      posts.push(data.val())
                    }
                  })
                })
              }
              this.setState({ user : matchedUser[0], profileImages,posts,showImages : profileImages,waiting : false })
            }
        }else{
            this.props.navigation.replace("Signin")
        }
        })
    }
    render(){
        if( this.state.waiting ){
          return( 
            <View style={[STYLES.generalPage,{justifyContent : "center",alignItems : "center"}]}>
              <Spinner size={"large"} color="red"  />
            </View>
          )
        }
        return (
            <View style={styles.container}> 
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
                    <Animated.View style={{ position : "absolute", left : width * 0.08 ,marginTop : -30}}>
                      <Avatar
                        size={50}
                        rounded
                        source={ this.state.user.userProfile ? { uri : this.state.user.userProfile } : 
                        require("../../../assets/account.png") }
                      />
                    </Animated.View>
                    <Animated.View style={{ flexDirection : "row",position : "absolute",left : width * 0.25,
                      justifyContent : "center",alignItems : "center",marginTop : -25,}}>
                      <Text style={{fontSize : 24,fontWeight : "bold",color : "white"}}> {this.state.user.userName} </Text>
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
                  style={[{paddingTop : HEADER_HEIGHT-20,opacity : this.backgroundOpacity, }]}
                  scrollEventThrottle={16}
                  onScroll={Animated.event([
                  {
                      nativeEvent : { contentOffset : {y : this.scrollY } }
                  }
                  ])}
              >
                    <View style={{flexDirection:'row',marginLeft : 0,}}>
                        <View style={{marginVertical:15}}>
                            <Avatar
                                size={85}
                                rounded
                                showEditButton='true'
                                source={ this.state.user.userProfile ? {  uri : this.state.user.userProfile } : require("../../../assets/account.png") }
                            />
                            <Text style={{color:'rgba(245,245,245,0.75)',marginVertical:10,fontSize : 20}}> {this.state.user.name} </Text>
                        </View>
                        <View>
                            <TouchableOpacity style={styles.button}>
                              <View style={{justifyContent:'center',alignItems:'center'}}>
                                <Text style={{color:'rgba(245,245,245,0.75)',fontWeight:'bold',fontSize:15}}>{this.state.user.numPosts}</Text>
                              </View>
                              <Text style={{color:'rgba(245,245,245,0.75)',fontSize:15}}>Posts</Text>
                            </TouchableOpacity>
                        </View>
                        <View>
                            <TouchableOpacity style={styles.button} onPress={()=>{this.props.navigation.navigate("Followers",{
                              params : {
                                uid : this.state.userId
                              }
                            })}}>
                            <View style={{justifyContent:'center',alignItems:'center'}}>
                            <Text style={{color:'rgba(245,245,245,0.75)',fontWeight:'bold',fontSize:15}}>{this.state.user.numFollowers}</Text>
                            </View>
                            <Text style={{color:'rgba(245,245,245,0.75)',fontSize:15}}>Followers</Text>
                            </TouchableOpacity>
                        </View>
                        <View>
                            <TouchableOpacity style={styles.button} onPress={()=>{this.props.navigation.navigate("Following",{
                              params : {
                                uid : this.state.userId
                              }
                            })}}>
                            <View style={{justifyContent:'center',alignItems:'center'}}>
                            <Text style={{color:'rgba(245,245,245,0.75)',fontWeight:'bold',fontSize:15}}>{this.state.user.numFollowing}</Text>
                            </View>
                            <Text style={{color:'rgba(245,245,245,0.75)',fontSize:15}}>Following</Text>
                            </TouchableOpacity>
                        </View> 
                    </View>
                    <View>
                        <Text style={{color:'rgba(245,245,245,0.75)',fontSize : 15,marginTop : -20,marginBottom : 10}}> {this.state.user.bio} </Text>
                    </View>
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
                                      picData : item, user : this.state.user,objectId : this.state.objectId,postObjectId : this.state.user.posts[index].postObjectId,
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
                </Animated.ScrollView>
                <Animated.View style={{height : height/5,...StyleSheet.absoluteFill, 
                  top : null,justifyContent : "center",zIndex : this.textInputZindex,
                  opacity : this.textInputOpacity,
                  transform : [{translateY : this.textInputY}],
                  }} 
              >
                <TapGestureHandler onHandlerStateChange={this.onCloseState}>
                    <Animated.View style={[STYLES.closeBtn,{ top : 0 }]}>
                        <Animated.Text style={{fontSize : 15,
                        transform : [ { rotate : concat(this.rotateCross,'deg') } ]}}>X</Animated.Text>
                    </Animated.View>
                </TapGestureHandler>
                <Animated.View>
                {this.state.wait ?
                    <View style={[STYLES.bottomSheet,{ height : 100 }]}>
                      <Spinner style={{marginTop : 15,marginLeft : -30}} color="red" size="large" />
                    </View>
                  :   
                  <View style={[STYLES.bottomSheet,{ height : 100 }]}>
                    
                    <TouchableOpacity onPress={ () => this.props.navigation.navigate("EditProfile") }  
                      style={[styles.eachNumber,styles.hr,{ flexDirection : "row",marginTop : 5 }]} >
                        <Text style={{color : "#94f00a",fontWeight : "bold",marginLeft : -25}}> Edit Profile </Text>
                        <AntDesign style={{marginLeft : 10}} name="edit" size={22} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress = { () => {
                          this.setState({ wait : true })
                          firebase.auth().signOut()
                          .then( () => {
                            
                          } )
                          .catch( err => {
                              console.log(err)
                          } )
                      } }  style={[styles.eachNumber,{ flexDirection : "row",width : "100%" }]} >
                        <Text style={{color : "#de2c2c",fontWeight : "bold",marginLeft : -25}}> Logout </Text>  
                        <MaterialCommunityIcons style={{marginLeft : 10}} name="location-exit" color="white" size={22} />
                    </TouchableOpacity>
                  </View>    
                  }
                </Animated.View>
              </Animated.View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
      minHeight : Dimensions.get("window").height,
      backgroundColor: 'rgba(8,8,8,0.95)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addfavstory:{
      width:50,
      height:50,
      padding:20,
      borderWidth:2,
      borderRadius : 100,
      borderColor:'rgba(245,245,245,0.75)',
      width : "100%"
    },
    button:{
      padding: 15,
      marginVertical:30,
      marginHorizontal:1
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
    },
    eachNumber : {
      flex : 1,justifyContent : "center",alignItems : "center",
    },
    hr : { 
      borderBottomColor : "white",borderBottomWidth : 0.7,width : width - 40 
    },
});
