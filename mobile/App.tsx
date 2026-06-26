import React from "react";
import { PaperProvider } from "react-native-paper";

import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { ToneDrillMvpScreen } from "./src/screens/ToneDrillMvpScreen";
import { appTheme } from "./src/theme/theme";

export default function App() {
  return (
    <PaperProvider theme={appTheme}>
      <AppErrorBoundary>
        <ToneDrillMvpScreen />
      </AppErrorBoundary>
    </PaperProvider>
  );
}
