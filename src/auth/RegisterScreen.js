import React from 'react'
import {StyleSheet,Text,View,Dimensions,TextInput,KeyboardAvoidingView,TouchableOpacity,TouchableWithoutFeedback} from 'react-native'
import {Spinner} from 'native-base'
import {Asset} from 'expo-asset'
import {AppLoading} from 'expo'
import * as firebase from 'firebase'
import { Avatar } from 'react-native-elements';
import Svg,{Image,Circle,ClipPath} from 'react-native-svg'
import Animated, { Easing } from 'react-native-reanimated'
import {TapGestureHandler,State} from 'react-native-gesture-handler'
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';
import * as Font from 'expo-font'


const {width,height} = Dimensions.get("screen")
const {Value,event,block,cond,eq,set,Clock,startClock,stopClock,
debug,timing,clockRunning,interpolate,Extrapolate,concat} = Animated

import STYLES from '../styles/styles'
import config from '../Tab/config'

function cacheImages(images) {
    return images.map(image => {
        if (typeof image === 'string') {
        return Image.prefetch(image);
        } else {
        return Asset.fromModule(image).downloadAsync();
        }
    });
}
    

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

export class RegisterScreen extends React.Component {
    constructor(props){
        super(props);
        this.buttonOpacity = new Value(1)
        this.buttonY = interpolate(this.buttonOpacity,{
            inputRange:[0,1],
            outputRange : [100,0],
            extrapolate : Extrapolate.CLAMP
        })

        this.bgY = interpolate(this.buttonOpacity,{
            inputRange:[0,1],
            outputRange : [-height/3 - 80,0],
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
                    cond(eq(state,State.END), set(this.buttonOpacity,runTiming(new Clock(),1,0)) )
                ])
            }
        ])

        this.onCloseState = event([
            {
                nativeEvent : ({state}) => block ([
                    cond(eq(state,State.END), set(this.buttonOpacity,runTiming(new Clock(),0,1)) )
                ])
            }
        ])

        this.state = {
            isReady : false,name : "",email : "",password : "",wait : false,fontLoaded : false
        }
    }
    async _loadAssetsAsync() {
        const imageAssets = cacheImages([
            require('../../assets/bg.jpg'),
            require('../../assets/icon.jpeg'),
        ]);

        await Promise.all([...imageAssets]);
    }
    componentDidMount(){
        this.loadFonts()
    }
    loadFonts = async() => {
        await Font.loadAsync({
          'Caveat' : require("../../assets/fonts/Caveat-Regular.ttf"),
        })
        this.setState({ fontLoaded : true })
    }
    writeUserToDB = () => {
        var user = firebase.auth().currentUser
        var Users = firebase.database().ref("Users")
        var newUser = Users.push()
        newUser.set({
            name : user.displayName,
            userName : user.displayName,
            email : user.email,
            uid : user.uid,
            numFollowers : 0,
            numFollowing : 0,
            numPosts : 0,
            numSentRequests : 0 ,
            numReceivedRequests : 0,
            followers : [ {name : 'dummyEntry'} ],
            following : [{ name : "dummyEntry" }],
            messages : [ { user : { _id : "dummy"} } ],
            posts : [],
            bio : "",
            privacy : "Private",
            numNewNotifications : 0
        })
    }
    createAccount = (name,email,password) => {
        var self = this
        if(name != "" && email != "" && password != ""){
            this.setState({ wait : true })
            firebase.auth().createUserWithEmailAndPassword(email,password)
            .then(authenticate => {
                return authenticate.user.updateProfile({
                    displayName : name
                })
            })
            .then(()=>{
                self.writeUserToDB()
            })
            .then(()=>{
                this.setState({ wait : false })
                self.props.navigation.replace('Signin')
                alert("Please Login to continue...")
            })
            .catch(err => {
                this.setState({ wait : false })
                console.log(err)
                alert(err.message)
            })
        }else{
        alert("All fields are mandatory")
        }
    }
    onSwipe(gestureName, gestureState) {
        const {SWIPE_UP, SWIPE_DOWN, SWIPE_LEFT, SWIPE_RIGHT} = swipeDirections;
        this.setState({gestureName: gestureName});
        console.log(gestureName)
        switch (gestureName) {
          case SWIPE_UP:
            // this.setState({backgroundColor: 'red'});
            break;
          case SWIPE_DOWN:
            break;
          case SWIPE_LEFT:
            // this.setState({backgroundColor: 'blue'});
            break;
          case SWIPE_RIGHT:
            // this.setState({backgroundColor: 'yellow'});
            this.props.navigation.navigate("Signin")
            break;
        }
      }
    render(){
        if (!this.state.isReady || !this.state.fontLoaded) {
            return (
              <AppLoading
                startAsync={this._loadAssetsAsync}
                onFinish={() => this.setState({ isReady: true })}
                onError={console.warn}
              />
            );
          }
        return(
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'flex-end', }} behavior="height" enabled>
                    <Animated.View style={{...StyleSheet.absoluteFill,transform : [{
                        translateY : this.bgY
                    }]}}>        
                        <GestureRecognizer
                            onSwipe={(direction, state) => this.onSwipe(direction, state)}
                            config={config}
                            style={{
                                flex : 1,zIndex : -1
                            }}
                        >
                            <Svg height={height+50} width={width} >
                                <ClipPath id="clip">
                                    <Circle r={height+50} cx={width/2} />
                                </ClipPath>
                                <View style={{height : 70}} />
                                <Image 
                                    href={require("../../assets/bg.jpg")}
                                    width={width}
                                    height={height+50}
                                    preserveAspectRatio='xMidYMid slice'
                                    clipPath="url(#clip)"
                                />
                                <Avatar
                                    width={350}
                                    rounded
                                    height={300}
                                    top={10}
                                    left={18}
                                    source={ require("../../assets/icon.jpeg") }
                                />
                                <Text style={{color : "white",fontFamily : "Caveat",fontSize : 35,top : 40,textAlign : "center"}}> HEHlow-IN 
                                </Text>
                            </Svg>
                        </GestureRecognizer>
                    </Animated.View>
                    <View style={{height : height/3,justifyContent : "center"}} >
                        <TapGestureHandler onHandlerStateChange={this.onStateChange}>
                            <Animated.View style={{...styles.button,
                                opacity : this.buttonOpacity , transform : [{translateY : this.buttonY}] }}>
                                <Text style={{fontSize : 20,fontWeight : "bold"}}>REGISTER</Text>
                            </Animated.View>
                        </TapGestureHandler>
                        <TouchableWithoutFeedback onPress={() => this.props.navigation.navigate("Signin") }>
                            <Animated.View style={{...styles.button,backgroundColor : "#eb5234",
                                opacity : this.buttonOpacity, transform : [{
                                    translateY : this.buttonY
                                }] }} > 
                                <Text style={{fontSize : 20,fontWeight : "bold",color : "white"}}>SIGNIN</Text>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                        <Animated.View style={{height : height/3,...StyleSheet.absoluteFill, 
                            top : null,justifyContent : "center",zIndex : this.textInputZindex,
                            opacity : this.textInputOpacity,
                            transform : [{translateY : this.textInputY}],
                            
                            }} >
                            <TapGestureHandler onHandlerStateChange={this.onCloseState}>
                                <Animated.View style={styles.closeBtn}>
                                    <Animated.Text style={{fontSize : 15,
                                    transform : [ { rotate : concat(this.rotateCross,'deg') } ]}}>X</Animated.Text>
                                </Animated.View>
                            </TapGestureHandler>
                            {this.state.wait == true ? 
                            <Spinner color="red" size={"large"} /> : 
                            <Animated.View>
                                <TextInput 
                                    placeholder="NAME"
                                    style={STYLES.textInput}
                                    placeholderTextColor="black" value={this.state.name}
                                    onChangeText={(name)=>{this.setState({name})}}
                                />
                                <TextInput 
                                    placeholder="EMAIL"
                                    style={STYLES.textInput}
                                    placeholderTextColor="black"
                                    keyboardType='email-address' value={this.state.email} 
                                    onChangeText={(email)=>{this.setState({email})}}
                                />
                                <TextInput 
                                    placeholder="PASSWORD"
                                    style={STYLES.textInput}
                                    placeholderTextColor="black"
                                    secureTextEntry={true} value={this.state.password} 
                                    onChangeText={(password)=>{this.setState({password})}}
                                />
                                <TouchableOpacity onPress={()=>{this.createAccount(this.state.name,this.state.email,this.state.password)}} >
                                    <Animated.View style={styles.button} >
                                        <Text style={{fontSize : 20,fontWeight : "bold"}}>REGISTER</Text>
                                    </Animated.View>
                                </TouchableOpacity>
                            </Animated.View>
                            }
                        </Animated.View>
                    </View>
               
            </KeyboardAvoidingView>
        )
    }
}

const styles = StyleSheet.create({
    container : {
        flex : 1,
        backgroundColor : "#fff",
        justifyContent : "flex-end"
    },
    button : {
        backgroundColor : "white",
        height : 70,
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
    closeBtn : {
        height : 40,width : 40,
        backgroundColor : "white",
        borderRadius : 20,
        alignItems : "center",
        justifyContent : "center",
        position : "absolute",
        top : -50,
        left : width/2 - 20,
        shadowOffset : {width : 2,height : 2},
        shadowColor : 'black',
        shadowOpacity : 0.2,
        elevation : 2
    }
})