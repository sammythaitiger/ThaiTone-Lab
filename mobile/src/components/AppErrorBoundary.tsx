import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { appColors } from "../theme/colors";

type AppErrorBoundaryState = {
  errorMessage: string;
};

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      errorMessage: error.message || "The app hit an unexpected error.",
    };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (!this.state.errorMessage) {
      return this.props.children;
    }

    return (
      <View style={styles.screen}>
        <Text variant="headlineSmall" style={styles.title}>
          App crashed
        </Text>
        <Text variant="bodyMedium" style={styles.copy}>
          {this.state.errorMessage}
        </Text>
        <Button mode="contained" onPress={() => this.setState({ errorMessage: "" })}>
          Try again
        </Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
    backgroundColor: appColors.background,
  },
  title: {
    color: appColors.textPrimary,
    fontWeight: "700",
  },
  copy: {
    color: appColors.textSecondary,
    lineHeight: 22,
  },
});
