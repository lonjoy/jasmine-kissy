KISSY.add(function (S, Node,HtmlMock) {
    var $ = Node.all;
    var htmlMock = new HtmlMock();
    describe('matchers test', function () {
        var url1 = './specs/fixtures/jasmine-kissy_fixture.html';
        htmlMock.load(url1);
        it('toExist',function(){
              expect('#test').toExist();
        })
        it('toContain',function(){
            expect('#test').not.toContain();

            $('#test').append($('<div id=""demo" />'));
            expect('#test').toContain();
        })
        it('toHasClass',function(){
            expect('#test').toHasClass('test-wrapper');
        })
        it('toHasAttr',function(){
            expect('#test').toHasAttr('class');
        })
        it('toHasData',function(){
            $('#test').data('data-test','minghe');
            expect('#test').toHasData('data-test');
        })
        it('toShow',function(){
            expect('#test').toShow();
            $('#test').hide();
            expect('#test').not.toShow();
        })
        it('toEqualText',function(){
            expect('#test').toEqualText('my name is minghe.');
        })
    });

},{requires:['node','jasmine/htmlMock']});