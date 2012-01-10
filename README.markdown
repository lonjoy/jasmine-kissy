# jasmine-kissy

版本：`0.1`

jasmine-kissy向[Jasmine](http://pivotal.github.com/jasmine/)增加二个功能

- 1.快速加载html片段。jsTestDriver使用[jasmine-jstd-adapter](https://github.com/ibolmo/jasmine-jstd-adapter)(jasmine对jsTestDriver的适配器)，由于有自己的测试运行页面，无法向运行页面插入测试用html片段，所以在你的spec脚本中需要插入html片段。
- 2.增加用于KISSY的machers，只作用于KISSY的Node模块。
  
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


## 依赖

- Jasmine 1.1
- KISSY 1.2

jasmine-kissy应用的场景更多是在JsTestDriver使用jasmine来进行单元测试时候。

