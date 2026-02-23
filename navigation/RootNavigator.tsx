// src/navigation/RootNavigator.tsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

const isLoggedIn = false; // later replace with real auth state

const RootNavigator = () => {
  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
