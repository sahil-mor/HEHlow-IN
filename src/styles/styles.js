import {StyleSheet,Dimensions} from 'react-native'
const {width} = Dimensions.get("window")
const STYLES = StyleSheet.create({
    generalPage : {
        backgroundColor : "rgba(8,8,8,0.95)",
        flex : 1
    },
    text : {
        color : "white"
    },
    textInput : {
        height : 50,
        borderRadius : 25,
        borderWidth : 0.5,
        marginHorizontal : 20,
        paddingLeft : 10,
        marginVertical : 5,
        borderColor : "rgba(0,0,0,0.2)",
        backgroundColor: '#fff',
    },
    specialColor : {
        color : "rgba(245,245,245,0.8)"
    },
    updating : {
        height : 70,
        flexDirection : "row",
        width : width - 30,
        marginHorizontal : 15,
        backgroundColor : "lightgrey",
        borderRadius : 70,
        overflow : "hidden",
        justifyContent : "center",
        alignItems : "center",
        marginTop : 10
    },
    closeBtn : {
        height : 40,width : 40,
        backgroundColor : "white",
        borderRadius : 20,
        alignItems : "center",
        justifyContent : "center",
        position : "absolute",
        left : width/2 - 20,
        shadowOffset : {width : 2,height : 2},
        shadowColor : 'black',
        shadowOpacity : 0.2,
        elevation : 2
    },
    bottomSheet: {
        borderRadius : 25,
        borderWidth : 0.5,
        marginHorizontal : 20,
        paddingLeft : 10,
        marginVertical : 5,
        borderColor : "rgba(0,0,0,0.2)",
        backgroundColor: 'grey',
        flexDirection : "column",width : width-20,alignItems : "center"
    },
})

export default STYLES