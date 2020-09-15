import React from 'react'
import {StyleSheet,StatusBar,Text,View,Dimensions,TextInput,KeyboardAvoidingView,TouchableOpacity,TouchableWithoutFeedback} from 'react-native'
import {Asset} from 'expo-asset'
import {AppLoading} from 'expo'
import {Spinner} from 'native-base'
import { Avatar } from 'react-native-elements';
import Svg,{Image,Circle,ClipPath} from 'react-native-svg'
import Animated, { Easing } from 'react-native-reanimated'
import {TapGestureHandler,State} from 'react-native-gesture-handler'
import * as firebase from 'firebase'
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

export class LoginScreen extends React.Component {
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
            outputRange : [-height/3 - 50,0],
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
            isReady : false, email : "" , password : "",wait : false,fontLoaded : false
        }
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
    async _loadAssetsAsync() {
        const imageAssets = cacheImages([
          require('../../assets/icon.jpeg'),
          require('../../assets/bg.jpg'),
        ]);
    
        await Promise.all([...imageAssets]);
    }
    signInUser = async(email,password) => {
        this.setState({ wait : true })
        console.log("here")
        if(email != "" && password != ""){
          await firebase.auth().signInWithEmailAndPassword(email,password)
          .then(()=>{
            this.setState({ wait : true })
            this.props.navigation.replace("HomeApp")
          })
          .catch(err => {
            console.log(err)
            this.setState({ password : "",wait : false })
            alert(err.message)
          })
        }else{
          alert("Both fields are mandatory")
        }
        this.setState({ wait : false })
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
                this.props.navigation.navigate("Register")
            break;
            case SWIPE_RIGHT:
                // this.setState({backgroundColor: 'yellow'});
            break;
        }
    }
    render(){
        if (!this.state.isReady || !this.state.fontLoaded ) {
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
                    <StatusBar  barStyle="light-content" translucent={true} />
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
                            <Text style={{fontSize : 20,fontWeight : "bold"}}>SIGN IN</Text>
                        </Animated.View>
                    </TapGestureHandler>
                    <TouchableWithoutFeedback onPress={() => this.props.navigation.navigate("Register") }>
                        <Animated.View style={{...styles.button,backgroundColor : "#eb5234",
                            opacity : this.buttonOpacity, transform : [{
                                translateY : this.buttonY
                            }] }} > 
                            <Text style={{fontSize : 20,fontWeight : "bold",color : "white"}}>REGISTER</Text>
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
                                    placeholder="EMAIL"
                                    style={STYLES.textInput}
                                    placeholderTextColor="black" value={this.state.email}
                                    onChangeText={(email)=>{this.setState({email})}}  keyboardType="email-address"
                                />
                                <TextInput 
                                    placeholder="PASSWORD"
                                    style={STYLES.textInput}
                                    placeholderTextColor="black" value={this.state.password}
                                    onChangeText={(password)=>{this.setState({password})}} secureTextEntry={true}
                                />
                                <TouchableOpacity  onPress={()=>{this.signInUser(this.state.email,this.state.password)}} >
                                    <Animated.View style={styles.button} >
                                        <Text style={{fontSize : 20,fontWeight : "bold"}}>SIGN IN</Text>
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
        top : -20,
        left : width/2 - 20,
        shadowOffset : {width : 2,height : 2},
        shadowColor : 'black',
        shadowOpacity : 0.2,
        elevation : 2
    },
})