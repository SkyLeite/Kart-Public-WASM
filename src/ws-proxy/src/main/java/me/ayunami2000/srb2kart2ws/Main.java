package me.ayunami2000.srb2kart2ws;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.*;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketServerCompressionHandler;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;
import org.yaml.snakeyaml.nodes.Tag;
import org.yaml.snakeyaml.representer.Representer;

import java.io.*;
import java.lang.reflect.Field;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class Main {
    public static Set<Channel> channels = new HashSet<>();
    public static ConfigFile config;
    public static InetAddress udp_ip;
    private static Yaml yaml;
    private static File configFile;

    public static void main(String[] args) throws IOException, InterruptedException {
        configFile = new File("config.yml");
        if (configFile.isDirectory()) {
            System.exit(1);
            return;
        }
        if (!configFile.exists())
            Files.copy(Objects.requireNonNull(Main.class.getResourceAsStream("/config.yml")), Paths.get("config.yml"), StandardCopyOption.REPLACE_EXISTING);

        DumperOptions opts = new DumperOptions();
        opts.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
        opts.setPrettyFlow(true);
        Representer repr = new Representer(opts);
        repr.addClassTag(ConfigFile.class, Tag.MAP);
        yaml = new Yaml(new Constructor(ConfigFile.class, new LoaderOptions()), repr);
        config = yaml.load(Files.newInputStream(configFile.toPath()));

        udp_ip = InetAddress.getByName(config.udp_host);

        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        ServerBootstrap b = new ServerBootstrap();
        b.group(bossGroup, workerGroup)
                .channel(NioServerSocketChannel.class)
                .childHandler(new ChannelInitializer<Channel>() {
                    @Override
                    protected void initChannel(Channel ch) {
                        channels.add(ch);
                        ChannelPipeline pipeline = ch.pipeline();
                        pipeline.addLast("http-server-codec", new HttpServerCodec());
                        pipeline.addLast("http-object-aggregator", new HttpObjectAggregator(65536));
                        pipeline.addLast("http-websocket-detector", new SimpleChannelInboundHandler<HttpRequest>() {
                            @Override
                            protected void channelRead0(ChannelHandlerContext ctx, HttpRequest request) throws NoSuchFieldException, IllegalAccessException {
                                pipeline.remove("http-websocket-detector");
                                if (Main.config.ip_forwarding_enabled) {
                                    String ip = request.headers().get(Main.config.ip_forwarding_header);
                                    if (ip != null) {
                                        ip = ip.split(",", 2)[0];
                                        Field remoteAddressField = AbstractChannel.class.getDeclaredField("remoteAddress");
                                        remoteAddressField.setAccessible(true);
                                        remoteAddressField.set(ctx.channel(), new InetSocketAddress(ip, 0));
                                    }
                                }
                                for (String bannedIp : config.ip_bans)
                                    if (bannedIp.equalsIgnoreCase(((InetSocketAddress) ctx.channel().remoteAddress()).getAddress().getHostAddress())) {
                                        ctx.close();
                                        return;
                                    }
                                if (!config.http_source_enabled || (request.headers().contains(HttpHeaderNames.CONNECTION) && request.headers().get(HttpHeaderNames.CONNECTION).toLowerCase().contains("upgrade") && request.headers().contains(HttpHeaderNames.UPGRADE) && request.headers().get(HttpHeaderNames.UPGRADE).toLowerCase().contains("websocket"))) {
                                    pipeline.addLast("websocket-server-compression-handler", new WebSocketServerCompressionHandler());
                                    pipeline.addLast("websocket-server-protocol-handler", new WebSocketServerProtocolHandler("/", null, true, 65536));
                                    pipeline.addLast("udp-proxy-handler", new UDPProxyHandler(ctx));
                                } else {
                                    pipeline.addLast(new HttpSourceProxyHandler());
                                }
                                if (request instanceof FullHttpRequest) ((FullHttpRequest) request).retain();
                                pipeline.fireChannelRead(request);
                            }
                        });
                    }
                }).option(ChannelOption.SO_BACKLOG, 128)
                .childOption(ChannelOption.SO_KEEPALIVE, true);

        System.out.println("Starting srb2kart2ws on " + config.ws_host + ":" + config.ws_port + "!");
        ChannelFuture f = b.bind(config.ws_host, config.ws_port);

        if (System.console() == null) {
            f.sync();
            f.channel().closeFuture().sync();
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
            return;
        }

        BufferedReader consoleReader = new BufferedReader(new InputStreamReader(System.in));
        boolean running = true;
        while (running) {
            System.out.print(">");
            String[] cmd = consoleReader.readLine().trim().split(" ");
            switch (cmd[0].toLowerCase()) {
                case "help":
                    System.out.println("Commands: help ; stop ; banip ; unbanip ; kickip");
                    break;
                case "stop":
                    System.out.println("Stopping!");
                    running = false;
                    break;
                case "banip":
                case "kickip":
                    boolean ban = cmd[0].equalsIgnoreCase("banip");
                    if (cmd.length < 2) {
                        if (ban) {
                            System.out.println("Info: Bans the specified IP.\nUsage: banip <ip>");
                        } else {
                            System.out.println("Info: Kicks the specified IP.\nUsage: kick <ip>");
                        }
                        break;
                    }
                    try {
                        InetAddress ip = InetAddress.getByName(cmd[1]);
                        for (Channel ch : channels)
                            if (((InetSocketAddress) ch.remoteAddress()).getAddress().equals(ip))
                                ch.close();
                        if (ban) banIP(ip, false);
                        System.out.println("Done!");
                    } catch (UnknownHostException e) {
                        System.out.println("That IP is invalid!");
                    }
                    break;
                case "unban":
                case "unbanip":
                    if (cmd.length < 2) {
                        System.out.println("Info: Unbans the specified IP.\nUsage: " + cmd[0].toLowerCase() + " <ip>");
                        break;
                    }
                    try {
                        banIP(InetAddress.getByName(cmd[1]), true);
                        System.out.println("Done!");
                    } catch (UnknownHostException e) {
                        System.out.println("That IP is invalid!");
                    }
                    break;
                default:
                    System.out.println("Unknown command! Try \"help\" for help.");
            }
        }

        System.exit(0); // fack u
        f.channel().closeFuture().sync();
        workerGroup.shutdownGracefully();
        bossGroup.shutdownGracefully();
    }

    private static void banIP(InetAddress addr, boolean unban) {
        config.ip_bans.removeIf(s -> s.equalsIgnoreCase(addr.getHostAddress()));
        if (!unban) config.ip_bans.add(addr.getHostAddress());
        try (FileWriter writer = new FileWriter(configFile)) {
            yaml.dump(config, writer);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}