import * as React from 'react';
import { StyleSheet, Text, View,Platform,StatusBar,TouchableOpacity} from 'react-native';
import {Thumbnail} from 'native-base'
import Animated from 'react-native-reanimated'
import {FontAwesome,AntDesign} from '@expo/vector-icons'
const HEADER_HEIGHT = Platform.OS == 'ios' ? 115 : 70+StatusBar.currentHeight

export class Header extends React.Component{
  constructor(props){
    super(props)
    this.scrollY = new Animated.Value(0)
    this.diffClampScrollY = Animated.diffClamp(this.scrollY,0,HEADER_HEIGHT)
    this.headerY = Animated.interpolate(this.diffClampScrollY,{
      inputRange : [0, HEADER_HEIGHT],
      outputRange : [0,-HEADER_HEIGHT]
    })
  }
  render(){
    return(
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
        top : 0,}} />
        <Animated.View style={{  position : "absolute",
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
        flexDirection : "row"
      }}>
      {this.props.isHome ?
        <Animated.View style={{flex : 1,marginLeft : 20,marginTop : -25}}>
        { this.props.user.userProfile ? 
          <Thumbnail  style={{width : 50,height : 50}} small source={{ uri : this.props.user.userProfile}} /> : 
          <FontAwesome name="user-circle" size={35} color="white" />
        }
        </Animated.View> :
        <TouchableOpacity style={{marginLeft : 20,marginTop : -25}} onPress={() => this.props.navigation.openDrawer()  }>
          <AntDesign name="menuunfold" size={30} color="white" />
        </TouchableOpacity>  
      }
      <Animated.View style={{flex : 4,flexDirection : "row",justifyContent : "center",alignItems : "center",marginTop : -25}}>
        <Text style={{fontSize : 24,fontWeight : "bold",color : "white"}}> {this.props.user.userName} </Text>
      </Animated.View>
      <Animated.View style={{flex : 1,alignItems : "flex-end",marginRight : 25,marginTop : -25}}>
        {this.props.isHome ?
          <TouchableOpacity>
            <FontAwesome name="send-o" size={30} color="white"  />
          </TouchableOpacity> : 
          <View style={{marginVertical:15}}>
            <TouchableOpacity style={styles.addfavstory}>
                <View style={{justifyContent:'center',alignItems:'center',}}>
                  <Text style={{color:'rgba(245,245,245,0.75)',fontSize:24,marginBottom : 35}}>+</Text>
                </View>
            </TouchableOpacity>
          </View>
        }
      </Animated.View>
      </Animated.View>
    </Animated.View>
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
})