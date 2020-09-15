import { Buffer } from 'buffer';
global.Buffer = Buffer;

import React from 'react';
import { StyleSheet, Text,Dimensions, View ,TouchableOpacity,StatusBar} from 'react-native';

import * as firebase from 'firebase'
import {Ionicons} from '@expo/vector-icons'
import Animated from 'react-native-reanimated'
import dateformat from 'dateformat'
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import {Form,Item,Input,Label,Spinner } from 'native-base'
import uuid from 'react-native-uuid'
import { Avatar } from 'react-native-elements';
const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight
const {height} = Dimensions.get("window")

import STYLES from '../../styles/styles'

export class EditProfileScreen extends React.Component{
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
            user : null,userName : "",bio : "",gender : "",name : "",image : null,
            objectId : null,waiting : true,uploadingData : false
        }
      }
    componentDidMount(){
        firebase.auth().onAuthStateChanged(authenticate => {
            if(authenticate){
              this.findUser(authenticate.uid)
            }else{
                this.props.navigation.replace("Signin")
            }
        })
    }
    findUser = uid => {
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
                if(uid == u.uid){
                    matchedIndex = index
                }
                index++;
                return uid == u.uid
            })
            const user = matchedUser[0]
            if(matchedUser.length == 1){
                this.setState({ user : matchedUser[0],objectId : keys[matchedIndex] })
                if(matchedUser[0].userProfile){
                    this.setState({ image : matchedUser[0].userProfile, waiting : false, 
                        user : user,userName : user.userName,name : user.name,bio : user.bio,gender : user.gender  })
                }else{
                    this.setState({ image : false })
                }
            }
            }else{
                this.props.navigation.replace("Register")
            }
        })
    }
    doChanges = () => {
        if(this.state.user.userName !== this.state.userName ||
            this.state.user.name !== this.state.name ||
            this.state.user.bio !== this.state.bio ||
            this.state.user.gender !== this.state.gender ||
            this.state.image != null  
        ){
            if(this.state.gender != "Male" && this.state.gender != "Female" && this.state.gender != "Other"){
              alert("Gender Can Be - Male, Female or Other")
            }else{
              this.saveDataToDB(this.state.objectId)
            }
        }else{
            this.props.navigation.navigate("Profile")
        }
    }
    saveDataToDB = oid => {
        this.setState({ uploadingData : true })
        var user = firebase.database().ref("Users/" + oid )
        user.update({
            userName : this.state.userName,
            name : this.state.name,
            gender : this.state.gender,
            bio : this.state.bio
        })
        .then( () => {
            this.setState({ uploadingData : false })
        })
        .catch(error => console.log(error))
    }
    getPermissionAsync = async () => {
        if (Constants.platform.ios) {
          const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
          if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
          }
        }
    }
    _pickImage = async () => {
        this.getPermissionAsync();
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 4],
          quality: 1
        });
        const storageRef = firebase.storage().ref();
        if (!result.cancelled) {
          this.setState({ uploadingData : true })
          const imageDownloadUrl = await this.uploadImageAsync(result.uri,storageRef)
          this.setState({ imageDownloadUrl })
          this.uploadImageToDb(imageDownloadUrl)
        }
    };    
    //   TODO: upload image to firebase
    uploadImageAsync = async (uri, storageRef) => {
        const parts = uri.split(".");
        const fileExtension = parts[parts.length - 1]
    
        // create blob
        const blob = await new Promise( (resolve , reject) => {
          const xhr = new XMLHttpRequest();
          // .then
          xhr.onload = function(){
            resolve(xhr.response)
          };
          // .catch
          xhr.onerror = function(e){
            console.log(e)
            reject(new TypeError("Network request failed"))
          }
          xhr.responseType = "blob"
          xhr.open("GET",uri,true)
          xhr.send(null)
        } )
    
        // upload part
        const ref = storageRef
        .child("ProfileImages/" + this.state.user.userName + "-" + this.state.objectId)
        .child(uuid.v4() + "." + fileExtension)
        const snapshot = await ref.put(blob)
    
        //closes the blob
        blob.close()
        return await snapshot.ref.getDownloadURL()
    
    };
    returnTime = () => {
        var now = new Date();
        var Dates = dateformat(now, 'mmm d yyyy h:MM:ss TT');
        var time = dateformat(now, 'h:MM TT')
        return {
          time : time, date : Dates
        }
    }
    uploadImageToDb = imageURL => {
        var user = firebase.database().ref("Users/" + this.state.objectId )
        var currentImages = this.state.user.profileImages
        if(!currentImages){
          currentImages = []
        }
        var today = this.returnTime()
        var newProfile = {
          imageUrl : imageURL,uploadedOnDate : today.date,uploadedOnTime : today.time
        }
        currentImages.unshift(newProfile)
        user.update({
          userProfile : imageURL,profileImages : currentImages
        }).then( () => {
          alert("Image Uploaded Successfully")
          this.setState({ uploadingData : false, image : imageURL })
        } ).catch(err => {
          alert(err.message)
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
        return(
            <View style={STYLES.generalPage}>
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
                            <TouchableOpacity style={{marginLeft : 20}} onPress={() => this.props.navigation.navigate("Profile")  }>
                                <Ionicons name="md-arrow-round-back" size={30} color="white" />
                            </TouchableOpacity> 
                        </Animated.View>
                        <Animated.View style={{flex : 3,flexDirection : "row",justifyContent : "center",marginTop : -25}}>
                            <Text style={{fontSize : 22,fontWeight : "bold",color : "white",marginLeft : -170}}> Edit Profile </Text>
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
                ])}> 
                    {this.state.uploadingData ?
                        <View style={[styles.screen,{alignItems : "center"}]} >
                            <Spinner color="red" size="large" style={{marginTop : height/3}} />
                            <Text style={{ color : "white",fontWeight : "bold",fontSize : 17 }}> Please Wait... Data is being uploaded </Text>
                        </View>
                    :
                    <View style={styles.screen}>
                        <View style={styles.userImage}>
                            <Avatar
                                size={100}
                                rounded
                                showEditButton='true'
                                source={  this.state.image ?
                                    {  uri : this.state.image } : 
                                    require("../../../assets/account.png") 
                                }
                            />
                            <TouchableOpacity onPress={()=>{this._pickImage()}} style={{marginTop : 15}}>
                                <Text style={{fontSize : 18,color : "#0A79DF"}} >Change Profile Photo</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.formContainer}>
                            <Form>
                                <Item style={{marginBottom : 20}}>
                                    <Label style={styles.label}>Email</Label>
                                    <Input style={styles.textInput} value={this.state.user.email} disabled />
                                </Item>
                                <Item style={{marginBottom : 20}}>
                                    <Label style={styles.label}>Username</Label>
                                    <Input style={styles.textInput} value={this.state.userName} onChangeText={userName=>{this.setState({ userName })}}  />
                                </Item>
                                <Item style={{marginBottom : 20}}>
                                    <Label style={styles.label}>Name</Label>
                                    <Input style={styles.textInput} value={this.state.name} onChangeText={ name =>{this.setState({ name })}}  />
                                </Item>
                                <Item style={{marginBottom : 20}}>
                                    <Label style={styles.label}>Bio</Label>
                                    <Input style={styles.textInput} value={this.state.bio} onChangeText={bio=>{this.setState({ bio })}}  />
                                </Item>
                                <Item style={{marginBottom : 20}}>
                                    <Label style={styles.label}>Gender</Label>
                                    <Input style={styles.textInput} value={this.state.gender} onChangeText={gender=>{this.setState({ gender })}}  placeholder="Male" />
                                </Item>
                            </Form>
                        </View>
                        <TouchableOpacity onPress={()=>{this.doChanges()}} >
                            <Animated.View style={styles.button} >
                                <Text style={{fontSize : 20,fontWeight : "bold"}}>UPDATE DATA</Text>
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                }
                </Animated.ScrollView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    username : {
        position : "absolute",top : 40,color : "white",left : 50,fontSize : 20
    },
    screen :{
        marginTop : 20
    },
    userImage : {
        alignItems : "center"
    },
    formContainer : {
        marginTop : 30
    },
    label : {
        color : "white"
    },
    textInput : {
        color : "rgba(245,245,245,0.75)"
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
        elevation : 2,
        marginBottom : 120
    },
})