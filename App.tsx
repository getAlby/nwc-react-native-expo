import "./applyGlobalPolyfills";

import { webln } from "@getalby/sdk";
import React from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import PolyfillCrypto from "react-native-webview-crypto";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <PolyfillCrypto />
      <Balance />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: "100%",
  },
});

function Balance() {
  const nwcUrl =
    "nostr+walletconnect://69effe7b49a6dd5cf525bd0905917a5005ffe480b58eeb8e861418cf3ae760d9?relay=wss://relay.getalby.com/v1&secret=99e8fe6bf8777aa7e4ba572ab1d2fab9912bcd781900323cb734a9063927efc3";

  const [balance, setBalance] = React.useState<number | undefined>();
  (async () => {
    try {
      const nostrWebln = new webln.NostrWebLNProvider({
        nostrWalletConnectUrl: nwcUrl,
      });
      await nostrWebln.enable();
      const response = await nostrWebln.getBalance();
      console.log("Balance response", response);
      setBalance(response.balance);
    } catch (error) {
      console.error(error);
    }
  })();
  return <Text>Balance: {balance ?? "Loading..."}</Text>;
}
