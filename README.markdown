# jasmine-kissy
jasmine-kissy向[Jasmine](http://pivotal.github.com/jasmine/)增加二个功能

1.快速加载html片段。jsTestDriver使用[jasmine-jstd-adapter](https://github.com/ibolmo/jasmine-jstd-adapter)(jasmine对jsTestDriver的适配器)，由于有自己的测试运行页面，无法向运行页面插入测试用html片段，所以在你的spec脚本中需要插入html片段。
2.增加用于KISSY的machers，只作用于KISSY的Node模块。
  
## Global variable

- `JF`JamineFixture的实例，使用JF的`load()`读取html片段

## Fixtures

## KISSY matchers

## Dependencies

jasmine-jquery was tested with Jasmine 1.1 and KISSY 1.1.6 on IE, FF and Chrome.

## Cross domain policy problems under Chrome

Newer versions of Chrome don't allow file:// URIs read other file:// URIs. In effect, jasmine-jquery cannot properly load fixtures under some versions of Chrome. An override for this is to run Chrome with a switch `--allow-file-access-from-files` (I have not verified if this works for all Chrome versions though). The full discussion on this topic can be found in [this GitHub ticket](https://github.com/velesin/jasmine-jquery/issues/4).

## Testing with Javascript Test Driver

When using [jstd](http://code.google.com/p/js-test-driver/) and the jasmine adapter you will need to include jasmine-jquery.js after your jasmine-jstd-adapter files, otherwise jasmine-jquery matchers will not be available when tests are executed. 

