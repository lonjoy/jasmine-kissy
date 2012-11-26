/**
 * a scalable client io framework
 * @author  yiminghe@gmail.com , lijing00333@163.com
 */
KISSY.add("ajax/base", function (S, JSON, Event, XhrObject) {

        var rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|widget):$/,
            rspace = /\s+/,
            rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,
            mirror = function (s) {
                return s;
            },
            HTTP_PORT = 80,
            HTTPS_PORT = 443,
            rnoContent = /^(?:GET|HEAD)$/,
            curLocation,
            curLocationParts;


        try {
            curLocation = location.href;
        } catch (e) {
            S.log("ajax/base get curLocation error : ");
            S.log(e);
            // Use the href attribute of an A element
            // since IE will modify it given document.location
            curLocation = document.createElement("a");
            curLocation.href = "";
            curLocation = curLocation.href;
        }

        curLocationParts = rurl.exec(curLocation);

        var isLocal = rlocalProtocol.test(curLocationParts[1]),
            transports = {},
            defaultConfig = {
                // isLocal:isLocal,
                type:"GET",
                // only support utf-8 when post, encoding can not be changed actually
                contentType:"application/x-www-form-urlencoded; charset=UTF-8",
                async:true,
                // whether add []
                serializeArray:true,
                // whether param data
                processData:true,

                accepts:{
                    xml:"application/xml, text/xml",
                    html:"text/html",
                    text:"text/plain",
                    json:"application/json, text/javascript",
                    "*":"*/*"
                },
                converters:{
                    text:{
                        json:JSON.parse,
                        html:mirror,
                        text:mirror,
                        xml:S.parseXML
                    }
                },
                contents:{
                    xml:/xml/,
                    html:/html/,
                    json:/json/
                }
            };

        defaultConfig.converters.html = defaultConfig.converters.text;

        function setUpConfig(c) {
            // deep mix
            c = S.mix(S.clone(defaultConfig), c || {}, undefined, undefined, true);
            if (!S.isBoolean(c.crossDomain)) {
                var parts = rurl.exec(c.url.toLowerCase());
                c.crossDomain = !!( parts &&
                    ( parts[ 1 ] != curLocationParts[ 1 ] || parts[ 2 ] != curLocationParts[ 2 ] ||
                        ( parts[ 3 ] || ( parts[ 1 ] === "http:" ? HTTP_PORT : HTTPS_PORT ) )
                            !=
                            ( curLocationParts[ 3 ] || ( curLocationParts[ 1 ] === "http:" ? HTTP_PORT : HTTPS_PORT ) ) )
                    );
            }

            if (c.processData && c.data && !S.isString(c.data)) {
                // 必须 encodeURIComponent 编码 utf-8
                c.data = S.param(c.data, undefined, undefined, c.serializeArray);
            }

            c.type = c.type.toUpperCase();
            c.hasContent = !rnoContent.test(c.type);

            if (!c.hasContent) {
                if (c.data) {
                    c.url += ( /\?/.test(c.url) ? "&" : "?" ) + c.data;
                }
                if (c.cache === false) {
                    c.url += ( /\?/.test(c.url) ? "&" : "?" ) + "_ksTS=" + (S.now() + "_" + S.guid());
                }
            }

            // 数据类型处理链，一步步将前面的数据类型转化成最后一个
            c.dataType = S.trim(c.dataType || "*").split(rspace);

            c.context = c.context || c;
            return c;
        }

        function fire(eventType, xhr) {
            io.fire(eventType, { ajaxConfig:xhr.config, xhr:xhr});
        }

        function handleXhrEvent(e) {
            var xhr = this,
                c = xhr.config,
                type = e.type;
            if (this.timeoutTimer) {
                clearTimeout(this.timeoutTimer);
            }
            if (c[type]) {
                c[type].call(c.context, xhr.responseData, xhr.statusText, xhr);
            }
            fire(type, xhr);
        }

        function io(c) {
            if (!c.url) {
                return undefined;
            }
            //mock data
            if(useMock){
                // c.url在执行setUpConfig()后，会拼接上c.data，mock时并不需要
                var mockUrl = c.url;
            }

            c = setUpConfig(c);
            var xhr = new XhrObject(c);
            fire("start", xhr);
            var transportContructor = transports[c.dataType[0]] || transports["*"],
                transport = new transportContructor(xhr);
            xhr.transport = transport;

            if (c.contentType) {
                xhr.setRequestHeader("Content-Type", c.contentType);
            }
            var dataType = c.dataType[0],
                accepts = c.accepts;
            // Set the Accepts header for the server, depending on the dataType
            xhr.setRequestHeader(
                "Accept",
                dataType && accepts[dataType] ?
                    accepts[ dataType ] + (dataType === "*" ? "" : ", */*; q=0.01"  ) :
                    accepts[ "*" ]
            );

            // Check for headers option
            for (var i in c.headers) {
                xhr.setRequestHeader(i, c.headers[ i ]);
            }

            xhr.on("complete success error", handleXhrEvent);

            xhr.readyState = 1;

            fire("send", xhr);

            // Timeout
            if (c.async && c.timeout > 0) {
                xhr.timeoutTimer = setTimeout(function () {
                    xhr.abort("timeout");
                }, c.timeout * 1000);
            }

            //add by 明河
            var useMock = io.useMock;

            if(useMock){
                xhr.status = io.mock.status;
                xhr.responseText = io.mock.responseText || "";
                xhr.readyState = io.mock.readyState;
                xhr.mimeType = io.mock.contentType;
            }else{
                try {
                    // flag as sending
                    xhr.state = 1;
                    transport.send();
                } catch (e) {
                    // Propagate exception as error if not done
                    if (xhr.status < 2) {
                        xhr.callback(-1, e);
                        // Simply rethrow otherwise
                    } else {
                        S.error(e);
                    }
                }
            }

            return xhr;
        }

        S.mix(io, Event.Target);
        S.mix(io, {
            isLocal:isLocal,
            setupConfig:function (setting) {
                S.mix(defaultConfig, setting, undefined, undefined, true);
            },
            setupTransport:function (name, fn) {
                transports[name] = fn;
            },
            getTransport:function (name) {
                return transports[name];
            },
            getConfig:function () {
                return defaultConfig;
            }
        });

        /**
         * @author 明河
         */
        S.mix(io, {
            /**
             * 是否mock ajax数据
             * @type Boolean
             * @default false
             */
            useMock:false,
            /**
             * 添加mock的伪数据
             * @param {String} url 需要mock的接口
             * @param {Object} response 数据类似{status:200,responseText:''}
             */
            response:function(url,response){
                if(!S.isString(url)){
                    S.log('response的url不存在！');
                    return false;
                }
                if(S.isObject(response)){
                    var responses = io.responses;
                    response = {
                        //mock 状态码，200为成功
                        status:response.status,
                        //mock接口返回数据数据
                        responseText:response.responseText || "",
                        //mock接口返回的数据头信息
                        contentType:response.responseHeaders || defaultConfig.accepts.json
                    };
                    responses[url] = response;
                }
                return responses[url];
            },
            /**
             * 结果集集合
             * @type Object
             * @default {}
             */
            responses:{}
        });

        io.Response = function(){

        };



        return io;
    },
    {
        requires:["json", "event", "ajax/xhrobject"]
    });