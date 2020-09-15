import React from 'react';
import { StyleSheet, Text, View,TouchableOpacity } from 'react-native';
import {Camera} from 'expo-camera'
import {FontAwesome} from '@expo/vector-icons'
import * as Permissions from 'expo-permissions';
export class CameraScreen extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            hasCameraPermission : null,
            type: Camera.Constants.Type.back,
            isFlashLightOn : Camera.Constants.FlashMode.off
        }
    }
    static navigationOption = {
        title : "Camera"
    }
    async componentDidMount(){
        const {status} = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({ hasCameraPermission : status })
    }
    flipCamera = () => {
        this.setState({
            type : this.state.type === Camera.Constants.Type.back ? Camera.Constants.Type.front : Camera.Constants.Type.back
        })
    }
    flashLight = () => {
        this.setState({
            isFlashLightOn : this.state.isFlashLightOn === Camera.Constants.FlashMode.off ?  Camera.Constants.FlashMode.on :  Camera.Constants.FlashMode.off
        })
    }
    takePicture = async () => {
        if(this.camera){
            let photo = await this.camera.takePictureAsync()
            this.props.navigation.navigate("NewPost",{ photo : photo })
        }
    }
    render(){
        const {hasCameraPermission} = this.state;
        if(hasCameraPermission === null){
            return(
                <View />
            )
        }else if(hasCameraPermission === false){
            return(
                <View>
                    <Text>No access to camera</Text>
                </View>
            )
        }else if(hasCameraPermission === "granted"){
            return (
              <View style={styles.container}>
                  <Camera 
                    style={styles.cameraView}
                    type = {this.state.type}
                    flashMode = {this.state.isFlashLightOn}
                    ref = {ref => {
                        this.camera = ref
                    }}
                  >
                  <View style={styles.actionContainer}>
                      <TouchableOpacity style={styles.iconHolder} onPress={()=>{this.flipCamera()}}>
                            <FontAwesome name="camera" size={35} style={styles.icon} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconHolder} onPress={()=>{this.takePicture()}}>
                            <FontAwesome name="circle" size={35} style={styles.icon} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconHolder} onPress={()=>{this.flashLight()}}>
                            <FontAwesome name="flash" size={35} style={styles.icon} />
                      </TouchableOpacity>
                  </View>
                  </Camera>
              </View>
            )
        }
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraView : {
      flex : 1
  },
  actionContainer : {
      flexDirection : "row",flex : 1
  },
  iconHolder : {
      flex : 1,alignItems : "center",alignSelf : "flex-end"
  },
  icon : {
      color : "white"
  }
});
