import { LightningAddress } from "@getalby/lightning-tools";
import "./applyGlobalPolyfills";

import { webln } from "@getalby/sdk";
import React from "react";
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import PolyfillCrypto from "react-native-webview-crypto";
import WebView from "react-native-webview";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <PolyfillCrypto />
      <NWCPlayground />
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

function NWCPlayground() {
  const [nwcUrl, setNwcUrl] = React.useState("");
  const [pendingNwcUrl, setPendingNwcUrl] = React.useState("");
  const [nwcAuthUrl, setNwcAuthUrl] = React.useState("");
  const [paymentRequest, setPaymentRequest] = React.useState("");
  const [preimage, setPreimage] = React.useState("");
  const [nostrWebLN, setNostrWebLN] = React.useState<
    webln.NostrWebLNProvider | undefined
  >(undefined);

  const [balance, setBalance] = React.useState<number | undefined>();
  React.useEffect(() => {
    if (!nwcUrl) {
      return;
    }
    (async () => {
      try {
        const _nostrWebLN = new webln.NostrWebLNProvider({
          nostrWalletConnectUrl: nwcUrl,
        });
        setNostrWebLN(_nostrWebLN);
        await _nostrWebLN.enable();
        const response = await _nostrWebLN.getBalance();
        console.log("Balance response", response);
        setBalance(response.balance);
      } catch (error) {
        console.error(error);
      }
    })();

    (async () => {
      try {
        const lightningAddress = new LightningAddress("hello@getalby.com");
        await lightningAddress.fetch();
        const invoice = await lightningAddress.requestInvoice({
          satoshi: 1,
        });
        setPaymentRequest(invoice.paymentRequest);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [nwcUrl]);

  async function payInvoice() {
    try {
      if (!nostrWebLN) {
        throw new Error("No WebLN provider");
      }
      const result = await nostrWebLN.sendPayment(paymentRequest);
      setPreimage(result.preimage);
    } catch (error) {
      console.error(error);
    }
  }

  async function connectWithAlby() {
    const nwc = webln.NostrWebLNProvider.withNewSecret({
      //authorizationUrl: "http://192.168.1.102:8080",
    });
    const authUrl = nwc.getAuthorizationUrl({
      name: "React Native NWC demo",
    });
    setPendingNwcUrl(nwc.getNostrWalletConnectUrl(true));
    setNwcAuthUrl(authUrl.toString());
  }

  if (nwcAuthUrl) {
    return (
      <WebView
        source={{ uri: nwcAuthUrl }}
        injectedJavaScriptBeforeContentLoaded={`

        // TODO: remove once NWC also posts messages to the window
        window.opener = window;

        // Listen for window messages
        window.addEventListener("message", (event) => {
          window.ReactNativeWebView.postMessage(event.data?.type);
        });
        
      `}
        onMessage={(event) => {
          if (event.nativeEvent.data === "nwc:success") {
            setNwcAuthUrl("");
            setNwcUrl(pendingNwcUrl);
          }
        }}
      />
    );
  }

  return (
    <>
      {!nwcUrl && (
        <>
          <Text>Paste NWC URL</Text>
          <TextInput
            onChangeText={(text) => setNwcUrl(text)}
            style={{
              borderColor: "black",
              borderWidth: 1,
              padding: 10,
              margin: 10,
            }}
          />
          <Text>or</Text>
          <Button title="Connect with Alby NWC" onPress={connectWithAlby} />
        </>
      )}
      {nwcUrl && (
        <>
          <Text>Balance</Text>
          <Text>{balance ?? "Loading..."}</Text>
          <Text>Pay an invoice</Text>
          <Text>{paymentRequest ?? "Loading..."}</Text>
          {paymentRequest && (
            <Button title="Pay invoice (1 sat)" onPress={payInvoice} />
          )}
          <Text>{preimage ? `PAID: ${preimage}` : "Not paid yet"}</Text>
        </>
      )}
    </>
  );
}
