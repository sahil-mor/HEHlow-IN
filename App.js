import React from 'react';
import { Image } from 'react-native';
import {NavigationContainer}  from "@react-navigation/native"
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs"
import {createDrawerNavigator} from '@react-navigation/drawer'
import {createStackNavigator} from "@react-navigation/stack"
import * as firebase from 'firebase'

import {LoginScreen,RegisterScreen} from './src/auth'
import {HomeScreen} from './src/Tab/Home'
import {SearchScreen} from './src/Tab/Search'
import {NotificationScreen} from './src/Tab/Notification'
import {ProfileScreen,EditProfileScreen} from './src/Tab/Profile'
import {FollowersScreen,FollowingScreen,SeeOtherAccount} from './src/Tab/Follower'
import {NewPost,CameraScreen,ShowPost,LikedBy,ReplyComment} from './src/Tab/Post'
import {MessageScreen,SendMessageScreen} from './src/Tab/Message'

import firebaseConfig from './firebaseConfig'

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const navOptionHandler = () => ({
  headerShown : false
})


const StackHome = createStackNavigator()
function HomeStack(){
  return(
    <StackHome.Navigator initialRouteName="Home">
      <StackHome.Screen name="Home" component={HomeScreen} options={navOptionHandler} />
      <StackHome.Screen name="Search" component={SearchScreen} options={navOptionHandler} />
      <StackHome.Screen name="Message" component={MessageScreen} options={navOptionHandler} />
      <StackHome.Screen name="Notification" component={NotificationScreen} options={navOptionHandler} />
      <StackHome.Screen name="Profile" component={ProfileScreen} options={navOptionHandler} />
      <StackHome.Screen name="EditProfile" component={EditProfileScreen} options={navOptionHandler} />
      <StackHome.Screen name="Followers" component={FollowersScreen} options={navOptionHandler} />
      <StackHome.Screen name="SeeOtherAccount" component={SeeOtherAccount} options={navOptionHandler} />
      <StackHome.Screen name="Following" component={FollowingScreen} options={navOptionHandler} />
      <StackHome.Screen name="SendMessage" component={SendMessageScreen} options={navOptionHandler} />
      <StackHome.Screen name="Camera" component={CameraScreen} options={navOptionHandler} />
      <StackHome.Screen name="ShowPost" component={ShowPost} options={navOptionHandler} />
      <StackHome.Screen name="LikedBy" component={LikedBy} options={navOptionHandler} />
      <StackHome.Screen name="ReplyComment" component={ReplyComment} options={navOptionHandler} />
    </StackHome.Navigator>
  )
}

const Tab = createBottomTabNavigator()

function TabNavigator({route}){
  return(
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused
              ? require("./assets/icons/home-white.png")
              : require("./assets/icons/home-black.png") ;
          } else if(route.name === 'NewPost'){
            iconName = focused
              ? require("./assets/icons/add-white.png")
              : require("./assets/icons/add-black.png") ;
          }
           else if (route.name === 'Notification') {
            iconName = focused ? require("./assets/icons/heart-white.png")
            : require("./assets/icons/heart-black.png") ;
          } else if (route.name === 'Profile') {
            iconName = focused ? require("./assets/icons/profile-white.png")
            : require("./assets/icons/profile-black.png") ;
          } 
          return <Image source={iconName} style={{width : 20,height : 20}} resizeMode="contain" />;
        },
      })}
      tabBarOptions={{
        activeTintColor: 'red',
        inactiveTintColor: 'black',
      }}
      >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="NewPost" component={NewPost} />
      <Tab.Screen name="Notification" component={NotificationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}


const StackApp = createStackNavigator()


export default function App(){
  return(
    <NavigationContainer>
      <StackApp.Navigator initialRouteName="HomeApp">
        <StackApp.Screen name="Signin" component={LoginScreen} options={navOptionHandler} />
        <StackApp.Screen name="HomeApp" component={TabNavigator} options={navOptionHandler} />
        <StackApp.Screen name="Register" component={RegisterScreen} options={navOptionHandler} />
      </StackApp.Navigator>
    </NavigationContainer>
  )
}