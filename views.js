(function() {
  
  var _ = require('underscore');
  _.str = require('underscore.string');
  var marked = require('marked');
  var config = require('./config.json');
  var GitHubApi = require('github');
  var async = require('async');
  
  function getIssueData(issue) {
    var htmlBody = marked(issue.body);
    
    var issueData = {
      number: issue.number,
      title: issue.title,
      body: htmlBody,
      plainBody: _.str.stripTags(htmlBody),
      epics: [],
      tags: [],
      category: null
    };
    
    for (var labelIndex = 0, labelCount = issue.labels.length; labelIndex < labelCount; labelIndex++) {
      var label = issue.labels[labelIndex];
      var name = _.str.trim(label.name);
      
      if (_.str.startsWith(name, "(Cat)")) {
        issueData.category = _.str.trim(name.substring(5));
      } else if (_.str.startsWith(name, "(Epic)")) {
        issueData.epics.push({
         name: _.str.trim(name.substring(7)),
         color: label.color
        });
      } else if (_.str.startsWith(name, "(EE)")) {
        issueData.effortEstimation = {
         name:  _.str.trim(name),
         color: label.color
        };
      } else {
        issueData.tags.push({
         name: name,
         color: label.color
        });
      }
    }
    
    return issueData;
  }
  
  function listOpenIssues(github, ignoreEstimated, callback) {
    github.issues.repoIssues({
      user: config.github.user,
      repo: config.github.repo,
      state: 'open',
      per_page: 5000
    }, function (err, issues) {
      if (err) {
       callback(err);
      } else {
        var issueDatas = {
          'Uncategorized': []
        };
        
        for (var issueIndex = 0, issueCount = issues.length; issueIndex < issueCount; issueIndex++) {
          var issue = issues[issueIndex];
          var issueData = getIssueData(issue);
          var category = issueData.category||'Uncategorized';
          if (!issueDatas[category]) {
            issueDatas[category] = [];
          }
          
          issueDatas[category].push(issueData);
        }
        
        callback(null, {
          categories: _.keys(issueDatas),
          issueDatas: issueDatas
        });
      }
    });
  }
  
  function listEffortEstimations (github, done) {
    var eeMap = _.object(_.map(config.effortEstimations, function(effortEstimation){
      return [effortEstimation.label, effortEstimation.text];
    }));
    
    var calls = _.map(_.pluck(config.effortEstimations, 'label'), function (label) {
      return function (callback) {
        github.issues.getLabel({
          user: config.github.user,
          repo: config.github.repo,
          name: label
        }, callback);
      };
    });
    
    async.parallel(calls, function (errs, labels) {
      done(errs, _.map(labels, function (label) {
        return {
          name: label.name,
          color: label.color,
          text: eeMap[label.name]
        };
      }));
    });
  }
  
  module.exports.selectRole = function (req, res) {
    if (req.query.role) {
      req.session.role = req.query.role;
      if(req.query.newPokerName){
    	  console.log(req.query.newPokerName);
    	  req.session.roomName = req.query.newPokerName;
      }
      res.redirect('/');
    } else {
      res.render('selectrole', {
        title : 'Select Session Role',
        user: config.github.user,
        repo: config.github.repo
      });
    }
  };
  
  module.exports.selectRoom = function (req, res) {
    if (req.query.room) {
      req.session.roomName = req.query.room;
      res.redirect('/');
    } else {
      res.render('selectroom', {
        title : 'Select Poker Room',
        user: config.github.user,
        repo: config.github.repo
      });
    }
  };
  

  module.exports.index = function (req, res) {
    if (!req.session.role) {
      res.redirect('/selectrole');
    } else {
      var github = new GitHubApi({
        version: "3.0.0"
      });
      
      github.authenticate({
        type: "oauth",
        token: req.user.accessToken
      });

      switch (req.session.role) {
        case 'master':
          listOpenIssues(github, true, function (err, data) {
            if (err) {
              res.send(500, err);
            } else {
              listEffortEstimations(github, function (eeErr, effortEstimations) {
                if (eeErr) {
                  res.send(500, eeErr);
                } else {
                  github.user.get({}, function (userErr, user) {
                    if (userErr) {
                      res.send(500, userErr);
                    } else {
                      res.render('master', {
                        title : 'OctoPo',
                        user: config.github.user,
                        repo: config.github.repo,
                        categories: data.categories,
                        issueDatas: data.issueDatas,
                        effortEstimations: effortEstimations,
                        userId: user.id,
                        userAvatar: user.avatar_url,
                        userName: user.name,
                        userRole: req.session.role,
                        currentRoom: req.session.roomName
                      });
                    }
                  });
                }
              });
            }
          });
        break;
        case 'participant':
          listEffortEstimations(github, function (eeErr, effortEstimations) {
            if (eeErr) {
              res.send(500, eeErr);
            } else {
              github.user.get({}, function (userErr, user) {
                if (userErr) {
                  res.send(500, userErr);
                }else if(!req.session.roomName){
                	res.redirect('/selectroom');
                } else {
                  res.render('participant', {
                    title : 'OctoPo',
                    user: config.github.user,
                    repo: config.github.repo,
                    effortEstimations: effortEstimations,
                    userId: user.id,
                    userAvatar: user.avatar_url,
                    userName: user.name,
                    userRole: req.session.role,
                    currentRoom: req.session.roomName
                  });
                }
              });
            }
          });
        break;
      }
    }
  };
  
  module.exports._saveEstimation = function (req, res) {
    var number = req.query.number;
    var estimate = req.query.estimate;
    
    var github = new GitHubApi({
      version: "3.0.0"
    });
    
    github.authenticate({
      type: "oauth",
      token: req.user.accessToken
    });
    
    github.issues.getRepoIssue({
      user: config.github.user,
      repo: config.github.repo,
      number: number
    }, function (err, issue) {
      if (err) {
        res.send(500, err);
      } else {
        var labels = _.map(issue.labels, function(label){
          if (!_.str.startsWith(label.name, "(EE)")) {
            return label.name;
          }
        });
        
        labels = _.reject(labels, function (label) {
          return !label;
        });
        
        labels.push(estimate);
        
        github.issues.edit({
          user: config.github.user,
          repo: config.github.repo,
          number: number,
          title: issue.title,
          body: issue.body,
          assignee: issue.assignee ? issue.assignee.login : null,
          milestone:  issue.milestone ? issue.milestone.number : null,
          labels: labels,
          state: issue.state
        }, function (editErr) {
          if (editErr) {
            res.send(500, editErr);
          } else {
            res.send(200);
          }
        });
      }
    });
  };
  
  module.exports._estimation = function (req, res) {
    var number = req.query.number;
    
    var github = new GitHubApi({
      version: "3.0.0"
    });
    
    github.authenticate({
      type: "oauth",
      token: req.user.accessToken
    });
    
    github.issues.getRepoIssue({
      user: config.github.user,
      repo: config.github.repo,
      number: number
    }, function (err, issue) {
      if (err) {
        res.send(500, err);
      } else {
        res.render('_estimation', {
          user: config.github.user,
          repo: config.github.repo,
          issue: getIssueData(issue)
        });
      }
    });
  };
  
  module.exports._rooms = function (req, res) {
	  res.send(req.rooms);
  };
  
}).call(this);