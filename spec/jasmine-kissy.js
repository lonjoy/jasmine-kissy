describe('test jasmine-kissy', function () {
    var url1 = 'jasmine-kissy_fixture.html',
        url2 = 'jasmine-kissy-2_fixture.html';
    JF.path = 'spec/fixtures';
    it('成功读取html片段文件', function () {
        JF.load(url1);
        expect($('#test')).toExist();
        expect(JF.cache[url1]).not.toBeUndefined();
    });
    it('成功读取html片段',function(){
        JF.read(url2);
        expect(JF.cache[url2]).not.toBeUndefined();
    });
    it('清理缓存和html片段', function () {
        JF.clean();
        JF.cleanCache();
        expect($('#test')).not.toExist();
        expect(JF.cache[url1]).toBeUndefined();
    });
    it('加载多个html片段', function () {
        JF.load(url1, url2);
        expect($('#test')).toExist();
        expect($('#test2')).toExist();
    });
    it('matchers测试', function () {
        JF.load(url1, url2);
        expect($('#test')).toHasClass('test-wrapper');
        expect($('#test')).toEqualText('my name is minghe.');
        expect($('#test-input')).toEqualValue('kissy');
        expect($('#test-input')).toHasAttr('type');
        $('#test-input').data('author','minghe');
        expect($('#test-input')).toHasData('author');
        expect($('#test-checkbox')).toHasProp('checked');
    })

});