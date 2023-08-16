package me.ayunami2000.srb2kart2ws;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.BinaryWebSocketFrame;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;

public class UDPProxyHandler extends SimpleChannelInboundHandler<BinaryWebSocketFrame> {
    private DatagramSocket socket;

    public UDPProxyHandler(ChannelHandlerContext ctx) {
        try {
            socket = new DatagramSocket();
            new Thread(() -> {
                try {
                    while (ctx.channel().isActive()) {
                        byte[] buf = new byte[1450];
                        DatagramPacket datagramPacket = new DatagramPacket(buf, buf.length);
                        if (socket == null) return;
                        socket.receive(datagramPacket);
                        ByteBuf bb = Unpooled.copiedBuffer(buf, 0, datagramPacket.getLength());
                        ctx.writeAndFlush(new BinaryWebSocketFrame(bb));
                    }
                } catch (IOException ee) {
                    ee.printStackTrace();
                }
            }).start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        if (socket != null) socket = null;
        Main.channels.remove(ctx.channel());
        super.channelInactive(ctx);
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, BinaryWebSocketFrame msg) throws IOException {
        ByteBuf bb = msg.content();
        byte[] buf = new byte[bb.writerIndex()];
        bb.readBytes(buf);
        if (socket == null) return;
        socket.send(new DatagramPacket(buf, buf.length, Main.udp_ip, Main.config.udp_port));
    }
}