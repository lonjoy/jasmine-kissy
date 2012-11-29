# jasmine-kissy

版本：`1.0`

jasmine-kissy是为了方便基于kissy的代码进行单元测试，而向[Jasmine](http://pivotal.github.com/jasmine/)添加的扩展。

jasmine-kissy主要扩展了如下三个功能

- 1.增加kissy的ajax mock功能（伪造ajax的假数据方便进行ajax测试）
- 2.快速加载html片段。jsTestDriver使用[jasmine-jstd-adapter](https://github.com/ibolmo/jasmine-jstd-adapter)(jasmine对jsTestDriver的适配器)，由于有自己的测试运行页面，无法向运行页面插入测试用html片段，所以在你的spec脚本中需要插入html片段。
- 3.增加用于KISSY的machers，只作用于KISSY的Node模块。

##ajax mock

jasmine-kissy中的ajax mock远比[jasmine ajax](https://github.com/pivotal/jasmine-ajax)来的强大。

- 你无需修改任何源码js
- 能够直接截获接口，当脚本向接口发送请求时，直接劫持到伪结果集
- 简单，根据status自动返回对应的结果集，你只需要书写一份伪数据
- 完美支持jsonp，无需任何标识
- 支持kissy的所有io方法，比如get()、post()、jsonp等

目前不支持mock io.upload()。

demo传送门：[mock api test](http://demo.36ria.com/jasmine-kissy/ajax_mock_spec_runner.html)


####引入依赖文件

想要mock kissy的ajax，需要覆盖"ajax/base"模块，所以不能引入kissy.js文件，只能引用seed-min.js，然后引入jasmine-kissy.js文件，比如下面的代码：

```html
  <script type="text/javascript" src="http://a.tbcdn.cn/s/kissy/1.2.0/??seed-min.js,dom-min.js,event-min.js,node-min.js"></script>
  <script type="text/javascript" src="src/jasmine-kissy.js"></script>
```

####ajax的伪数据

```javascript
KISSY.add(function (S) {
    return [
        {
            status:200,
            responseText: '{"status":1,"name":"minghe"}'
        },
        {
            status:500,
            responseText:''
        },
        {
            status:200,
            data:{site:'36ria'},
            responseText: '{"status":2,"site":"36ria"}'
        },
        {
            status:200,
            responseText: 'jsonp1234({"status":1,"name":"minghe"})'
        },
        {
            status:200,
            data:{site:'36ria'},
            responseText: 'jsonp5454({"status":2,"site":"36ria"})'
        }
    ]
});
```

一份伪数据为一个数组，包含各种状态下的结果集，比如成功，失败，传入不同参数时。

- status：值为200时，为成功状态，会触发io的**sucess**事件
- data：为前端传递给服务器端的参数，对应io的**data**参数，当不存在匹配时，mock类会返回不带参数的结果集
- responseText：文本结果集，留意jsonp时的文本，mock类会自动判断jsonp

####mock 的使用

```javascript
        var api = "http://service.taobao.com/support/minerva/ajax/refundPlugAjax.htm";
        //使用mock
        io.useMock = true;
        //装入伪数据
        io.install(api, simpleData);
        //使用成功状态的假数据
        io.use(api, 200);
```

**io.useMock=true** 开启ajax mock

**io.install(api, simpleData)** 装入伪数据，simpleData即上面的demo数据

**io.use(api, 200)** 使用成功状态的伪数据

 接下来可以使用io方法试试

```javascript
            // 用于ajax的回调测试
            onSuccess = jasmine.createSpy('onSuccess');
            //触发异步请求
            S.io({
                url:api,
                type:"GET",
                success:function (data, status) {
                    onSuccess(data);
                }
            });

            var successResult = onSuccess.mostRecentCall.args[0];
            expect(onSuccess).toHaveBeenCalledWith(jasmine.any(Object));
            expect(successResult.status).toEqual(1);
            expect(successResult.name).toEqual('minghe');
```
onSuccess方法将会被执行一次，并且它的第一个参数的值为：

```javascript
{"status":1,"name":"minghe"}
```

如果你想要mock 接口失败时的情况

```javascript
        it('use error data mock',function(){
            //使用失败状态的假数据
            io.use(api,500);

            onError = jasmine.createSpy('onError');

            //触发异步请求
            S.io({
                url:api,
                type:"GET",
                error:function(data){
                    onError(data);
                }
            });

            expect(onError).toHaveBeenCalled();
        });
```
mock jsonp的接口情况也是如此

```javascript
            io.use(api,200);

            onSuccess = jasmine.createSpy('onSuccess');
            //异步请求带上不存在的参数
            S.io.jsonp(api,function(data){
                onSuccess(data);
            });
            var successResult = onSuccess.mostRecentCall.args[0];
            expect(onSuccess).toHaveBeenCalledWith(jasmine.any(Object));
            expect(successResult.status).toEqual(1);
            expect(successResult.name).toEqual('minghe');
```
如果你想要mock，不同传参下的接口

 ```javascript
            io.use(api,200);

            onSuccess = jasmine.createSpy('onSuccess');
            //异步请求带上指定参数
            S.io({
                url:api,
                type:"GET",
                data:{site:'36ria'},
                success:function (data, status) {
                    onSuccess(data);
                }
            });
            var successResult = onSuccess.mostRecentCall.args[0];
            expect(onSuccess).toHaveBeenCalledWith(jasmine.any(Object));
            expect(successResult.status).toEqual(2);
            expect(successResult.site).toEqual('36ria');
 ```

 所有的mock都非常简单，你无需修改源码js，mock类会自动处理，你唯一要做的就是install伪数据，然后use你想要的结果集

## 全局变量
为了方便测试用例页面直接使用，定义了几个全局变量

- `JF`JamineFixture的实例，使用JF的`load()`读取html片段
- `S` KISSY的缩写变量
- `$` KISSY.Node.all的缩写变量



## 加载html片段
必须先配置html片段所放的目录路径，`JF.path = 'spec/fixtures'`

假设在你的`spec/fixtures`目录有个html片段文件`jasmine-kissy_fixture.html`。

文件的内容如下：
    <div id="test" class="test-wrapper">
        my name is minghe.
    </div>

使用如下语法加载这个文件：

    `JF.load('jasmine-kissy_fixture.html');`

你可以测试下#test这个div是否存在：

    `expect($('#test')).toExist();`

(ps:toExist()是jasmine-kissy新增的macher，用于测试节点是否存在)

加载的片段会放入缓存，避免重复加载。

需要加载多个文件，语法如下：

    `JF.load('jasmine-kissy_fixture.html'，'jasmine-kissy-2_fixture.html');`

加载的html片段会放在页面的测试容器内，容器id为`#J_JF`。

清理html片段，（jasmine-kissy会自动清理），使用`JF.clean()`。

清理缓存，使用`JF.cleanCache()`。

## KISSY matchers

留意这些matcher只适用于KISSY的Node方式。


- `toExist()` 测试节点的存在性
- `toHasClass()` 测试节点是否拥有指定的class名
- `toHasAttr()` 测试节点是否拥有指定的属性值
- `toHasProp()` 测试节点是否拥有指定的property值
- `toHasData()` 测试节点是否拥有指定扩展属性值
- `toContain()` 测试节点是否有子节点
- `toEqualValue()` 测试节点的的value值
- `toEqualText()` 测试节点的text

示例代码：

  `expect($('#test')).toHasClass('test-wrapper');`

  `expect($('#test')).toEqualText('my name is minghe.');`


## 依赖

- Jasmine 1.1
- KISSY 1.2

jasmine-kissy应用的场景更多是在JsTestDriver使用jasmine来进行单元测试时候。

