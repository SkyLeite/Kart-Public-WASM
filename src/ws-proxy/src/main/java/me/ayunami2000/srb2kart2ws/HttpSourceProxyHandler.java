package me.ayunami2000.srb2kart2ws;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.*;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

public class HttpSourceProxyHandler extends SimpleChannelInboundHandler<FullHttpRequest> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest msg) throws Exception {
        URL url = new URL(Main.config.http_source_url + (msg.uri().startsWith("/") ? msg.uri() : ("/" + msg.uri())));
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod(msg.method().name());
        con.setInstanceFollowRedirects(true);
        for (Map.Entry<String, String> header : msg.headers()) con.setRequestProperty(header.getKey(), header.getValue());
        ByteBuf bb = Unpooled.buffer();
        bb.writeBytes(con.getInputStream(), con.getContentLength());
        FullHttpResponse resp = new DefaultFullHttpResponse(msg.protocolVersion(), HttpResponseStatus.valueOf(con.getResponseCode()), bb);
        resp.headers().add(HttpHeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
        ctx.writeAndFlush(resp);
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        Main.channels.remove(ctx.channel());
        super.channelInactive(ctx);
    }
}