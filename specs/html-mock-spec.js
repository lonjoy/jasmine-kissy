KISSY.add(function (S, Node,HtmlMock) {
    var $ = Node.all;
    var htmlMock = new HtmlMock();
    describe('test fixture', function () {
        var url1 = './specs/fixtures/jasmine-kissy_fixture.html',
            url2 = './specs/fixtures/jasmine-kissy-2_fixture.html';
        htmlMock.path = './specs/fixtures/';
        it('成功读取html片段文件', function () {
            htmlMock.load(url1);
            expect($('#test')).toExist();
            expect(htmlMock.cache[url1]).not.toBeUndefined();
        });
        it('清理缓存和html片段', function () {
            htmlMock.clean();
            htmlMock.cleanCache();
            expect($('#test')).not.toExist();
            expect(htmlMock.cache[url1]).toBeUndefined();
        });
    });

},{requires:['node','jasmine/htmlMock']});