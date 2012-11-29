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

            if (useMock) {
                mock(c, xhr);
            } else {
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
         *  mock方法
         * @param c
         * @param xhr
         */
        function mock(c, xhr) {
            var mockData = io.currentResponse;
            if (!c.data) c.data = "";
            var type = c.dataType;
            var isJsonp = S.isArray(type) && type[0] == 'script' && type[1] == 'json';
            mockData = io._getResponseUseData(mockData, c.data, isJsonp);
            xhr.status = mockData.status;
            xhr.responseText = mockData.responseText || "";
            xhr.mimeType = mockData.contentType;

            if (isJsonp) {
                io._setJsonpCallback(xhr, mockData);
            }
            //触发ajax对象的回调
            xhr.callback(mockData.status);

            io.resetCurrentResponse();
        }

        /**
         * mock 方法
         * @author 明河
         */
        S.mix(io, {
            /**
             * 当前使用的伪数据
             * @type Object | Array
             * @default []
             */
            currentResponse:[],
            /**
             * 是否mock ajax数据
             * @type Boolean
             * @default false
             */
            useMock:false,
            /**
             * 重置currentResponse
             * @return Array
             */
            resetCurrentResponse:function () {
                return io.currentResponse = [];
            },
            /**
             * 添加mock的伪数据
             * @param {String} url 需要mock的接口
             * @param {Object} response 数据类似{status:200,responseText:''}
             */
            install:function (url, response) {
                if (!S.isString(url)) {
                    S.log('response的url不存在！');
                    return false;
                }
                if (S.isArray(response)) {
                    var responses = io.responses;
                    S.each(response, function (res, i) {
                        //mock接口返回的数据头信息
                        response[i].contentType = res.responseHeaders || defaultConfig.accepts.json;
                    });
                    responses[url] = response;
                }
                return responses[url];
            },
            /**
             * 使用指定状态码的数据
             * @param  {String} url
             * @param {Number|String} status
             */
            use:function (url, status) {
                if (!status || status == 'success') status = 200;

                var response = io.responses[url];
                if (!response) return false;

                return io.currentResponse = io._getResponse(response, status);
            },
            /**
             * 从大的伪数据（包含成功失败）获取指定状态码的伪数据
             * @param {Object}  response
             * @param {Number} status
             * @return {Array}
             * @private
             */
            _getResponse:function (response, status) {
                if (!response) return false;

                var res = [];
                if (S.isNumber(status)) {
                    S.each(response, function (r) {
                        if (r.status == status) {
                            res.push(r);
                        }
                    });
                }

                return res;
            },
            /**
             *  通过异步参数来过滤想要的假数据
             * @param {Array} response
             * @param {String} data
             * @param {Boolean} isJsonp 是否是jsonp
             * @private
             */
            _getResponseUseData:function (response, data, isJsonp) {
                var res = {};
                var oData = S.unparam(data);
                if (S.isEmptyObject(oData)) {
                    S.each(response, function (r) {
                        if (!r.data) {
                            if (isJsonp) {
                                if (io._isJsonpResponse(r)) {
                                    res = r;
                                    return false;
                                }
                            } else {
                                res = r;
                                return false;
                            }
                        }
                    })
                } else {
                    var hasData = false;
                    S.each(response, function (r) {
                        var str = S.param(r.data);
                        if (str == data) {
                            if (isJsonp) {
                                if (io._isJsonpResponse(r)) {
                                    res = r;
                                    hasData = true;
                                    return false;
                                }
                            } else {
                                res = r;
                                hasData = true;
                                return false;
                            }
                        }
                    });
                    if (!hasData) return io._getResponseUseData(response, '');
                }
                return res;
            },
            /**
             * 是否是jsonp的结果集
             * @param {Object} response 结果集·
             * @return {Boolean}
             * @private
             */
            _isJsonpResponse:function (response) {
                var responseText = response.responseText;
                return /\(/.test(responseText);
            },
            /**
             * 获取jsonp回调函数名
             * @param {Object} response
             * @private
             * @return {String}
             */
            _getJsonpCallbackName:function (response) {
                var responseText = response.responseText;
                return responseText.split('(')[0];
            },
            /**
             * mock jsonp的回调
             * @param {Object} xhr xhr对象
             * @param {Object} response 结果集
             * @private
             */
            _setJsonpCallback:function (xhr, response) {
                var callbackName = io._getJsonpCallbackName(response);
                //设置回调函数
                window[callbackName] = function (r) {
                    // jsonp 返回了数组
                    if (arguments.length > 1) {
                        r = S.makeArray(arguments);
                    }
                    xhr.responseData = r;
                    xhr.fire('success');
                };

                xhr.jsonpCallback = callbackName;
            },
            /**
             * 结果集集合
             * @type Object
             * @default {}
             */
            responses:{}
        });
        return io;
    },
    {
        requires:["json", "event", "ajax/xhrobject"]
    });

KISSY.add('jasmine/fixture',function(S,Node){
    var $ = Node.all;

    /**
     * @name JamineFixture
     * @class 用于jasmine测试前向页面插入测试用的html片段（应用于jsTestDriver）
     * @constructor
     */
    function JamineFixture(config) {
        var self = this;
        S.mix(self, JamineFixture.defaultConfig, config);
    }

    JamineFixture.defaultConfig = {
        /**
         * 容器钩子
         */
        wrapperHook:'#J_JF',
        /**
         * html片段插入dom的容器id
         */
        wrapperTpl:'<div id ="J_JF">{fixture}</div>',
        /**
         * 数据缓存
         */
        cache:{},
        /**
         * html片段存放的目录路径
         */
        path:'http://localhost:9876/test/spec/fixtures/'
    };
    S.augment(JamineFixture, {
        /**
         * ajax读取html文件，并插入到测试容器（可以是多个url）
         * @return {NodeList}
         */
        load:function () {
            var self = this, html;
            if (!arguments) return false;
            html = self.read.apply(self, arguments);
            return self._appendTo(html);
        },
        /**
         * 只读取html文件，返回html片段数据
         * @return {String}
         */
        read:function () {
            var self = this, urls = arguments, aHtml = [];
            if (!urls.length) return false;
            S.each(urls, function (url) {
                aHtml.push(self._getHtml(url));
            });
            return aHtml.join('');
        },
        /**
         * 清除测试容器内的节点
         * @return {NodeList}
         */
        clean:function () {
            var self = this, wrapperHook = self.wrapperHook;
            return $(wrapperHook).html('');
        },
        /**
         * ajax读取单个html文件
         * @param {String} url html文件的url
         * @return {String}
         */
        _getHtml:function (url) {
            var self = this, cache = self.cache,
                path = self.path, htmlUrl;
            //不存在该html片段的缓存，ajax请求
            if (S.isUndefined(cache[url])) {
                htmlUrl = path.match('/$') && path + url || path + '/' + url;
                S.io({
                    //async必须设置为false，同步加载文件，否则jasmine的测试有可能是在获取文件之前执行导致测试失败
                    async:false,
                    cache:false,
                    dataType:'html',
                    url:htmlUrl,
                    success:function (data) {
                        self.cache[url] = data;
                    },
                    error:function (xhr, status, errorThrown) {
                        throw Error('Fixture could not be loaded: ' + url + ' (status: ' + status + ', message: ' + errorThrown.message + ')');
                    }
                })
            }
            return self.cache[url];
        },
        /**
         * 向页面添加html片段dom
         * @param {string} html html片段
         */
        _appendTo:function (html) {
            if (!S.isString(html)) return false;
            var self = this, wrapperTpl = self.wrapperTpl,
                wrapperHook = self.wrapperHook,
                wrapperHtml;
            if ($(wrapperHook).length) {
                $(wrapperHook).html(html);
            } else {
                wrapperHtml = S.substitute(wrapperTpl, {'fixture':html});
                $('body').append(wrapperHtml);
            }
            return $(wrapperHook);
        },
        /**
         * 清理缓存
         */
        cleanCache:function () {
            this.cache = {};
            return this;
        }
    });
    KISSY.JamineFixture = JamineFixture;

    return JamineFixture;
},{requires:['node']});

KISSY.use('jasmine/fixture',function(){

});
JF = {};
S = KISSY;
beforeEach(function () {
    //实例化 JamineFixture
    JF = new S.JamineFixture();
    //添加新的matcher
    this.addMatchers({
        toExist:function () {
            return this.actual.length > 0;
        },
        toHasClass:function (className) {
            return this.actual.hasClass(className);
        },
        toHasAttr:function (attr) {
            return this.actual.hasAttr(attr);
        },
        toHasProp:function (prop) {
            return this.actual.hasProp(prop);
        },
        toHasData:function (dataName) {
            return this.actual.data(dataName) != '';
        },
        toContain:function (selector) {
            return this.actual.children(selector).length > 0;
        },
        toEqualValue:function (value) {
            return this.actual.val() === value;
        },
        toEqualText:function (text) {
            return S.trim(this.actual.text()) === text;
        },
        toShow:function () {
            return this.actual.css('display') === 'block';
        }
    });
});
afterEach(function () {
    JF.clean();
});