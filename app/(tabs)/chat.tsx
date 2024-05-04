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
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useEffect, useRef, useState } from "react";

import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Avatar } from "@rneui/themed";

export default function Chat() {
  const backendUrl = "http://192.168.0.10:8000";
  const [chatText, setChatText] = useState("");
  const [textInputHeight, setTextInputHeight] = useState(60);
  const [sendingChat, setSendingChat] = useState(false);
  const [conversation, setConversation] = useState<
    { role: String; content: string }[]
  >([]);

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

  const handleSubmit = async () => {
    setSendingChat(true);
    Keyboard.dismiss();
    const messageValue = chatText;
    if (messageValue.trim() === "") return;
    const newHumanMessage = {
      content: messageValue,
      role: "Human",
    };
    setConversation((prevConversation) => [
      ...prevConversation,
      newHumanMessage,
    ]);
    setChatText("");

    try {
      const response = await fetch(`${backendUrl}/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            question: messageValue,
            chat_history: []
          },
          config: {
            metadata: {
              conversation_id: 'conversationId',
            },
          },
        }),
      });
      if (response.ok) {
        // Parse the response body as JSON
        const jsonResponse = await response.json();
        // Extract the actual response content
        const responseData = jsonResponse; // Adjust this according to the structure of your response
        
        // Now you can work with the actual response data
        console.log(responseData);
        const newAIMessage = {
          content: responseData.trimEnd(),
          role: "AI",
        };
        setConversation((prevConversation) => [
          ...prevConversation,
          newAIMessage,
        ]);
      } else {
        // Handle error response
        console.error('Error:', response.statusText);
      }
    } catch (error) {
      setSendingChat(false);
      setChatText(messageValue);
      Alert.alert(
        "Could not connect to the server. Please navigate back and try again later."
      );
      console.error(error);
    }
    setSendingChat(false);
  };

  return (
    <View className="flex-1 items-center justify-center">
      <KeyboardAwareScrollView
        alwaysBounceVertical={false}
        className="flex-1 w-full"
      >
        <View className="flex-1 mt-3 mx-3">
          {conversation && conversation.length > 0 && (
            <View className="my-4">
              {conversation.map((msg, index) =>
                msg.role === "AI" ? (
                  <View
                    className="flex flex-row justify-start mb-2 items-center"
                    key={index}
                  >
                    <FontAwesome size={28} name="android" color="blue" />

                    <View className="p-2 bg-dark-blue mx-2 rounded-lg w-4/5 bg-gray-500">
                      <Text
                        style={{
                          fontSize: 16,
                          lineHeight: 20,
                        }}
                        className="text-white"
                      >
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View
                    className="flex flex-row justify-end mb-2 items-center"
                    key={index}
                  >
                    <View
                      className="p-2 bg-dark-red mr-2 rounded-lg bg-red-500"
                      style={{ maxWidth: "85%" }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          lineHeight: 20,
                        }}
                        className="text-white"
                      >
                        {msg.content}
                      </Text>
                    </View>
                    <Avatar
                      size={40}
                      rounded
                      title="GC"
                      containerStyle={{
                        backgroundColor: "red",
                      }}
                    />
                  </View>
                )
              )}
            </View>
          )}
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
