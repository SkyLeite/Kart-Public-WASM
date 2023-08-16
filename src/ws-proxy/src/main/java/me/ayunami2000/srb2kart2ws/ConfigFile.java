package me.ayunami2000.srb2kart2ws;

import java.util.ArrayList;
import java.util.List;

public class ConfigFile {
    public String ws_host = "0.0.0.0";
    public int ws_port = 8080;
    public String udp_host = "127.0.0.1";
    public int udp_port = 8080;
    public boolean ip_forwarding_enabled = false;
    public String ip_forwarding_header = "X-Forwarded-For";
    public List<String> ip_bans = new ArrayList<>();
    public boolean http_source_enabled = false;
    public String http_source_url = "";
}