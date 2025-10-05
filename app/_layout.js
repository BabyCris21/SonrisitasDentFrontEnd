// app/_layout.js
import { Slot } from "expo-router";
import { Box, NativeBaseProvider } from "native-base";
import { KeyboardAvoidingView, Platform } from "react-native";

export default function Layout() {
  return (
    <NativeBaseProvider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Box flex={1}>
          <Slot />
        </Box>
      </KeyboardAvoidingView>
    </NativeBaseProvider>
  );
}
