/**
 * @fileoverview 运行测试用例
 * @author 剑平（明河）<minghe36@gmail.com>
 **/
KISSY.add('jasmine/runner', function (S) {

    S.Config.debug = '@DEBUG@';
    S.config({
        packages:[
            {
                name:"gallery",
                path:"http://a.tbcdn.cn/s/kissy/",
                charset:"utf-8"
            }
        ]
    });

    /**
     * 执行jasmine，输出结果测试结果集
     */
    function execute() {
        var env = jasmine.getEnv();
        env.addReporter(new jasmine.HtmlReporter);
        env.execute();
    }

    /**
     *  运行测试模块
     * @param {String} mods 模块
     * @param {Object} package 包配置
     */
    function runner(mods, package) {
        var specsPackage = package;
        if (!S.isObject(specsPackage)) {
            specsPackage = {
                name:'specs',
                path:'./',
                charset:"gbk"
            }
        }

        S.config({ packages:[ specsPackage ] });


        S.use(mods,function(){
            execute();
        })
    }


    return runner;
});