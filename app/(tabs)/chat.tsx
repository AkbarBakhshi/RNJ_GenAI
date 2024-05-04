import {
  Pressable,
  TextInput,
  View,
  Animated,
  Keyboard,
  Easing,
  Platform,
  Text,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useEffect, useRef, useState } from "react";

import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export default function Chat() {
  const [chatText, setChatText] = useState("");
  const [textInputHeight, setTextInputHeight] = useState(60);
  const [sendingChat, setSendingChat] = useState(false);

  const translateYRef = useRef(new Animated.Value(0)).current;
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      "keyboardWillShow",
      (event) => {
        const { height: newKeyboardHeight } = event.endCoordinates;
        Animated.timing(translateYRef, {
          toValue: tabBarHeight - newKeyboardHeight, // negative value of translateY means move up
          duration: event.duration,
          easing: Easing.bezier(0.33, 0.66, 0.66, 1),
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      (event) => {
        Animated.timing(translateYRef, {
          toValue: 0,
          duration: event.duration,
          easing: Easing.bezier(0.33, 0.66, 0.66, 1),
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const handleContentSizeChange = (event: {
    nativeEvent: { contentSize: { height: number } };
  }) => {
    setTextInputHeight(Math.max(event.nativeEvent.contentSize.height, 40));
  };

  const handleSubmit = () => {
    console.log(chatText);
    setSendingChat(true);
    Keyboard.dismiss();
    const messageValue = chatText;
    if (messageValue.trim() === "") return;
    setChatText("");
    
    // TODO handle communications with BE
    setSendingChat(false);
  };

  return (
    <View className="flex-1 items-center justify-center">
      <KeyboardAwareScrollView
        alwaysBounceVertical={false}
        className="flex-1 w-full"
      >
        <View className="flex-1 mt-3 mx-3">
          <Text className="text-2xl">
            This is where messages go
          </Text>
        </View>
      </KeyboardAwareScrollView>
      <Animated.View
        style={{
          transform: [
            {
              translateY: Platform.OS === "ios" ? translateYRef : 0,
            },
          ],
        }}
        className="px-2 bg-white flex-row py-2 items-center"
      >
        <TextInput
          className="flex-1 border-2 rounded-xl border-gray-600 mr-4 px-3 max-h-20"
          multiline
          style={{ height: textInputHeight }}
          value={chatText}
          onChangeText={(text) => setChatText(text)}
          placeholder="Ask a question here"
          onContentSizeChange={handleContentSizeChange}
        />
        <Pressable
          style={{
            backgroundColor:
              chatText.trim() === "" || sendingChat ? "gray" : "blue",
          }}
          className="items-center justify-center w-12 rounded-full p-2"
          onPress={handleSubmit}
          disabled={chatText.trim() === "" || sendingChat}
        >
          {sendingChat ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="send" size={20} color={"white"} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}
