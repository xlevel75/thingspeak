
let esp8266Initialized = false
let rxData = ""
const THINGSPEAK_API_URL = "api.thingspeak.com"

function sendCommand(command: string, expected_response: string = null, timeout: number = 100): boolean 
{
    // Wait a while from previous command.
    basic.pause(10)

    // Flush the Rx buffer.
    serial.readString()
    rxData = ""

    // Send the command and end with "\r\n".
    serial.writeString(command + "\r\n")

    // Don't check if expected response is not specified.
    if (expected_response == null) {
        return true
    }

    // Wait and verify the response.
    let result = false
    let timestamp = input.runningTime()
    while (true) {
        // Timeout.
        if (input.runningTime() - timestamp > timeout) {
            result = false
            break
        }

        // Read until the end of the line.
        rxData += serial.readString()
        if (rxData.includes("\r\n")) {
            // Check if expected response received.
            if (rxData.slice(0, rxData.indexOf("\r\n")).includes(expected_response)) {
                result = true
                break
            }

            // If we expected "OK" but "ERROR" is received, do not wait for timeout.
            if (expected_response == "OK") {
                if (rxData.slice(0, rxData.indexOf("\r\n")).includes("ERROR")) {
                    result = false
                    break
                }
            }

            // Trim the Rx data before loop again.
            rxData = rxData.slice(rxData.indexOf("\r\n") + 2)
        }
    }

    return result
}
function getResponse(response: string, timeout: number = 100): string {
    let responseLine = ""
    let timestamp = input.runningTime()
    while (true) {
        // Timeout.
        if (input.runningTime() - timestamp > timeout) {
            // Check if expected response received in case no CRLF received.
            if (rxData.includes(response)) {
                responseLine = rxData
            }
            break
        }

        // Read until the end of the line.
        rxData += serial.readString()
        if (rxData.includes("\r\n")) {
            // Check if expected response received.
            if (rxData.slice(0, rxData.indexOf("\r\n")).includes(response)) {
                responseLine = rxData.slice(0, rxData.indexOf("\r\n"))

                // Trim the Rx data for next call.
                rxData = rxData.slice(rxData.indexOf("\r\n") + 2)
                break
            }

            // Trim the Rx data before loop again.
            rxData = rxData.slice(rxData.indexOf("\r\n") + 2)
        }
    }

    return responseLine
}

function uploadThingspeak(writeApiKey: string,
    field1: number,
    field2: number = null,
    field3: number = null,
    field4: number = null,
    field5: number = null,
    field6: number = null,
    field7: number = null,
    field8: number = null) {

    // Reset the upload successful flag.
    //thingspeakUploaded = false

    // Make sure the WiFi is connected.
    //if (isWifiConnected() == false) return

    // Connect to ThingSpeak. Return if failed.
    if (sendCommand("AT+CIPSTART=\"TCP\",\"" + THINGSPEAK_API_URL + "\",80", "OK", 10000) == false)
    { 
        basic.showString("error uploadThingspeak");
        return
    }

    // Construct the data to send.
    let data = "GET /update?api_key=" + writeApiKey + "&field1=" + field1
    if (field2 != null) data += "&field2=" + field2
    if (field2 != null) data += "&field3=" + field3
    if (field2 != null) data += "&field4=" + field4
    if (field2 != null) data += "&field5=" + field5
    if (field2 != null) data += "&field6=" + field6
    if (field2 != null) data += "&field7=" + field7
    if (field2 != null) data += "&field8=" + field8

    // Send the data.
    sendCommand("AT+CIPSEND=" + (data.length + 2))
    sendCommand(data)

    // Return if "SEND OK" is not received.
    if (getResponse("SEND OK", 1000) == "") return

    // Check the response from ThingSpeak.
    let response = getResponse("+IPD", 1000)
    if (response == "") return

    // Trim the response to get the upload count.
    response = response.slice(response.indexOf(":") + 1, response.indexOf("CLOSED"))
    let uploadCount = parseInt(response)

    // Return if upload count is 0.
    if (uploadCount == 0) return

    // Set the upload successful flag and return.
    //thingspeakUploaded = true
    return
}


basic.showString("start!");

ESP8266_IoT.initWIFI(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200)
ESP8266_IoT.connectWifi("AOffice", "88888888")

//basic.pause(2000)
//ESP8266_IoT.connectThingSpeak()

basic.pause(2000)

ESP8266_IoT.setData("Y12WD695XXK5RIYN", 5, 10, 5, 10, 5, 0, 0, 0);
ESP8266_IoT.uploadData()
basic.showString("send low");

basic.pause(2000)
ESP8266_IoT.setData("Y12WD695XXK5RIYN", 100, 110, 120, 130, 140, 0, 0, 0);
ESP8266_IoT.uploadData()
basic.showString("send high");

basic.pause(2000)
uploadThingspeak("Y12WD695XXK5RIYN", 77, 77, 77, 77, 0, 0, 0, 0);
basic.showString("send 77");


basic.pause(1000)
basic.showString("end");
