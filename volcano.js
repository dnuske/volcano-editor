
VolcanoCollection = new Mongo.Collection('volcano');

if (Meteor.isServer) {
  var fs = Npm.require('fs');
  var os = Npm.require('os');
  var path = Npm.require('path');
  var __project_dir = path.join(path.resolve('.'), '../../../../..');
  var __project_name = path.basename(__project_dir)

  Meteor.publish('volcano', function(){
      return VolcanoCollection.find();
  })

  Meteor.startup(function () {

    // take up whatever is in js, css and html files and store it in volcano collection
    console.log("volcano: initializing in",  __project_dir)

    var html = fs.readFileSync(path.join(__project_dir ,'godspeed.html'), "utf8");
    var css = fs.readFileSync(path.join(__project_dir ,'godspeed.css'), "utf8");
    var js = fs.readFileSync(path.join(__project_dir ,'godspeed.js'), "utf8");

    VolcanoCollection.update(
        {},
        {
            html: html,
            css: css,
            js: js
        },
        {upsert:true}
    );
  });

  Meteor.methods({
      save_file: function(purpose, content){
          console.log("server- save file called")

          var filename = path.join(__project_dir, __project_name+'.'+purpose)
          fs.writeFileSync(filename, content)
      }
  })
}

if (Meteor.isClient) {
    Meteor.startup(function(){
        Meteor.subscribe('volcano');

        Session.set('editor_active', 'js');
    })

    Template.editor.helpers({
        editor_content: function(){
            var editor_active = Session.get('editor_active');
            var volcanoCollection = VolcanoCollection.findOne();
            if (volcanoCollection){
                return volcanoCollection[editor_active];
            }
        }
    })

    Template.editor.events({
        'click [action="set_editor"]': function(e){
            Session.set('editor_active', e.currentTarget.attributes.value.value);
            var editor_active = Session.get('editor_active');
            var volcanoCollection = VolcanoCollection.findOne();
            var editor = ace.edit("editor");
            editor.setValue(volcanoCollection[editor_active], -1)
            editorModes = {
                js: 'javascript',
                html: 'html',
                css: 'css'
            }
            editor.getSession().setMode("ace/mode/"+editorModes[editor_active]);

        },
        'click [action="save_to_file"]': function(e){
            var editor = ace.edit("editor");
            Meteor.call("save_file", Session.get('editor_active'), editor.getSession().getValue());
            console.log("save file called")
        }
    })

    Template.editor.rendered = function(){
        var editor = ace.edit("editor");
        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode("ace/mode/javascript");

        Session.set('editor_active', 'html');
        var editor_active = Session.get('editor_active');
        var volcanoCollection = VolcanoCollection.findOne();
        var editor = ace.edit("editor");
        editor.setValue(volcanoCollection[editor_active], -1)
        editorModes = {
            js: 'javascript',
            html: 'html',
            css: 'css'
        }
        editor.getSession().setMode("ace/mode/"+editorModes[editor_active]);

    }
}
