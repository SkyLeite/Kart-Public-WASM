#include "doomdef.h"
#include "i_system.h"
#include "i_time.h"
#include "i_net.h"
#include "d_net.h"
#include "d_netfil.h"
#include "i_tcp.h"
#include "m_argv.h"
#include "stun.h"
#include "z_zone.h"

#include "doomstat.h"

#include <emscripten/emscripten.h>
#include <emscripten/websocket.h>
#include <stdio.h>

static boolean nodeconnected[MAXNETNODES+1];
static EMSCRIPTEN_WEBSOCKET_T socket;

EM_BOOL onopen(int eventType,
               const EmscriptenWebSocketOpenEvent *websocketEvent,
               void *userData) {
  CONS_Printf("onopen");

  socket = websocketEvent->socket;

  EMSCRIPTEN_RESULT result;
  result = emscripten_websocket_send_utf8_text(websocketEvent->socket, "hoge");
  if (result) {
    CONS_Printf("Failed to emscripten_websocket_send_utf8_text(): %d\n",
                result);
  }
  return EM_TRUE;
}
EM_BOOL onerror(int eventType,
                const EmscriptenWebSocketErrorEvent *websocketEvent,
                void *userData) {
  CONS_Printf("onerror");

  return EM_TRUE;
}
EM_BOOL onclose(int eventType,
                const EmscriptenWebSocketCloseEvent *websocketEvent,
                void *userData) {
  CONS_Printf("onclose");

  return EM_TRUE;
}
EM_BOOL onmessage(int eventType,
                  const EmscriptenWebSocketMessageEvent *websocketEvent,
                  void *userData) {
  CONS_Printf("onmessage");
  if (websocketEvent->isText) {
    // For only ascii chars.
    CONS_Printf("message: %s\n", websocketEvent->data);
  }

  EMSCRIPTEN_RESULT result;
  result =
      emscripten_websocket_close(websocketEvent->socket, 1000, "no reason");
  if (result) {
    CONS_Printf("Failed to emscripten_websocket_close(): %d\n", result);
  }
  return EM_TRUE;
}

static void WS_Send(void) {
    CONS_Printf("WS: Sending packet... \n");
    int result = emscripten_websocket_send_binary(socket, (char *)&doomcom->data, doomcom->datalength);
    CONS_Printf("Result: %d", result);
}
static boolean WS_Get(void) {
    doomcom->remotenode = -1; // no packet
    return false;
}
static void WS_CloseSocket(void) {}
static void WS_FreeNodenum(INT32 numnode) {}
static SINT8 WS_NetMakeNodewPort(const char *address, const char *port) {
    SINT8 j;

    for (j = 0; j < MAXNETNODES; j++)
        if (!nodeconnected[j])
        {
            nodeconnected[j] = true;
            return j;
        }

    return -1;
}

static const char *WS_GetNodeAddress(INT32 node) { return "self"; }
static boolean WS_Ban(INT32 node) { return true; }
static void WS_ClearBans(void) {}
static const char *WS_GetBanAddress(size_t ban) { return NULL; }
static const char *WS_GetBanMask(size_t ban) { return NULL; }
static const char *WS_GetBanUsername(size_t ban) { return NULL; }
static const char *WS_GetBanReason(size_t ban) { return NULL; }
static time_t WS_GetUnbanTime(size_t ban) { return NO_BAN_TIME; }
static boolean WS_SetBanAddress(const char *address, const char *mask) { return true; }
static boolean WS_SetBanUsername(const char *username) { return true; }
static boolean WS_SetBanReason(const char *reason) { return true; }
static boolean WS_SetUnbanTime(time_t timestamp) { return true; }

static bannednode_t WS_bannednode[MAXNETNODES+1]; /// \note do we really need the +1?

// No need to hole punch with a Websocket connection :)
// Thanks technology
static void WS_RequestHolePunch(INT32 node) {}
static void WS_RegisterHolePunch(void) {}

boolean WS_OpenSocket(void) {
  CONS_Printf("Socket being opened... fuck");

  if (!emscripten_websocket_is_supported()) {
    return false;
  }

  nodeconnected[0] = true; // always connected to self

  size_t i;
  for (i = 1; i < MAXNETNODES; i++)
    nodeconnected[i] = false;

  nodeconnected[BROADCASTADDR] = true;

  EmscriptenWebSocketCreateAttributes ws_attrs = {"wss://ws.postman-echo.com/raw",
                                                  NULL, EM_TRUE};

  EMSCRIPTEN_WEBSOCKET_T ws = emscripten_websocket_new(&ws_attrs);
  emscripten_websocket_set_onopen_callback(ws, NULL, onopen);
  emscripten_websocket_set_onerror_callback(ws, NULL, onerror);
  emscripten_websocket_set_onclose_callback(ws, NULL, onclose);
  emscripten_websocket_set_onmessage_callback(ws, NULL, onmessage);

  if (ws < 0) {
      CONS_Printf("Failed to connect to WS server?");
      return false;
  }

  socket = ws;

  I_NetSend = WS_Send;
  I_NetGet = WS_Get;
  I_NetCloseSocket = WS_CloseSocket;
  I_NetFreeNodenum = WS_FreeNodenum;
  I_NetMakeNodewPort = WS_NetMakeNodewPort;

  I_NetRequestHolePunch = WS_RequestHolePunch;
  I_NetRegisterHolePunch = WS_RegisterHolePunch;

  return true;
}

boolean I_InitWebsocketNetwork(void) {
  boolean is_server = false;

  I_NetOpenSocket = WS_OpenSocket;
  I_Ban = WS_Ban;
  I_ClearBans = WS_ClearBans;
  I_GetNodeAddress = WS_GetNodeAddress;
  I_GetBanAddress = WS_GetBanAddress;
  I_GetBanMask = WS_GetBanMask;
  I_GetBanUsername = WS_GetBanUsername;
  I_GetBanReason = WS_GetBanReason;
  I_GetUnbanTime = WS_GetUnbanTime;
  I_SetBanAddress = WS_SetBanAddress;
  I_SetBanUsername = WS_SetBanUsername;
  I_SetBanReason = WS_SetBanReason;
  I_SetUnbanTime = WS_SetUnbanTime;
  bannednode = WS_bannednode;

  server = is_server;
  return is_server;
}
