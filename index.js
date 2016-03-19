/* jshint node: true */
'use strict';
var DeployPluginBase = require('ember-cli-deploy-plugin');
var S3Client = require('./lib/aws-s3');
var CodeDeployClient = require('./lib/aws-codedeploy');
var path = require('path');
var minmatch = require('minimatch');
var Promise = require('ember-cli/lib/ext/promise');
module.exports = {
    name: 'ember-cli-deploy-aws-codedeploy',
    createDeployPlugin: function(options) {
        var DeployPlugin = DeployPluginBase.extend({
            name: options.name,
            defaultConfig: {
                filePattern: '**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2,yml,html,htm}',
                basePackageName: this.project.pkg.name + '-' + this.project.pkg.version,
                archiveType: 'zip',
                archiveTempDirectory: 'tmp',
                distDir: function(context) {
                    return context.distDir;
                },
                distFiles: function(context) {
                    return context.distFiles || [];
                },
                manifestPath: function(context) {
                    return context.manifestPath; // e.g. from ember-cli-deploy-manifest
                },
                revisionKey: function(context) {
                    var revisionData = context.revisionData;
                    return revisionData.revisionKey + '-' + revisionData.timestamp;
                },
            },
            ensureConfigPropertySet: function(propertyName) {
                if (!this.propertyByString(this.pluginConfig, propertyName)) {
                    var message = 'Missing required config: `' + propertyName + '`';
                    this.log(message, {
                        color: 'red'
                    });
                    throw new Error(message);
                }
            },
            propertyByString: function(object, property) {
                var properties = property.replace(/\[(\w+)\]/g, '.$1');
                properties = properties.replace(/^\./, '');
                var a = properties.split('.');
                for (var i = 0, n = a.length; i < n; ++i) {
                    var k = a[i];
                    if (k in object) {
                        object = object[k];
                    } else {
                        return;
                    }
                }
                return object;
            },
            requiredConfig: ['accessKeyId', 'secretAccessKey', 'region', 'archiveType', 'awsDeploymentOptions.applicationName', 'awsDeploymentOptions.revision.revisionType'],
            prepare: function(context) {
                /**
                 * We have two use cases here:
                 * 1. User wants to use S3 and Code Deploy
                 * 2. User does not want to use S3, only code deploy.
                 */
                this.awsCodeDeployServiceOptions = this.awsCodeDeployServiceOptions || {};
                var awsDeploymentOptions = this.readConfig('awsDeploymentOptions');
                if (awsDeploymentOptions.revision.revisionType === 'S3') {
                    this.awsS3ServiceOptions = this.awsS3ServiceOptions || {};
                    if (!this.awsS3ServiceOptions['accessKeyId'])
                        this.awsS3ServiceOptions['accessKeyId'] = this.readConfig('accessKeyId');
                    if (!this.awsS3ServiceOptions['secretAccessKey'])
                        this.awsS3ServiceOptions['secretAccessKey'] = this.readConfig('secretAccessKey');
                    if (!this.awsS3ServiceOptions['region'])
                        this.awsS3ServiceOptions['region'] = this.readConfig('region');
                    console.log('Manifest path');
                    console.log(this.readConfig('manifestPath'));
                    this._awsS3Client = new S3Client({
                        parentPlugin: this,
                        awsS3ServiceOptions: this.awsS3ServiceOptions,
                        distDir: this.readConfig('distDir'),
                        revisionKey: this.readConfig('basePackageName') + '-' + this.readConfig('revisionKey'),
                        manifestPath: this.readConfig('manifestPath'),
                        archiveType: this.readConfig('archiveType'),
                        archiveTempDirectory: this.readConfig('archiveTempDirectory'),
                    }, this);
                }
                if (!this.awsCodeDeployServiceOptions['accessKeyId'])
                    this.awsCodeDeployServiceOptions['accessKeyId'] = this.readConfig('accessKeyId');
                if (!this.awsCodeDeployServiceOptions['secretAccessKey'])
                    this.awsCodeDeployServiceOptions['secretAccessKey'] = this.readConfig('secretAccessKey');
                if (!this.awsCodeDeployServiceOptions['region'])
                    this.awsCodeDeployServiceOptions['region'] = this.readConfig('region');
                if (!awsDeploymentOptions)
                    awsDeploymentOptions = {};
                if (!awsDeploymentOptions.applicationName)
                    awsDeploymentOptions.applicationName = this.readConfig('basePackageName');
                this._awsCodeDeployClient = new CodeDeployClient({
                    log: this.log,
                    awsCodeDeployServiceOptions: this.awsCodeDeployServiceOptions,
                    awsDeploymentOptions: awsDeploymentOptions
                });
            },
            upload: function(context) {
                var distributionFiles = this.readConfig('distFiles');
                var filePattern = this.readConfig('filePattern');
                var revisionType = this.readConfig('revisionType');
                var awsDeploymentOptions = this.readConfig('awsDeploymentOptions');
                var filesToUpload = distributionFiles.filter(minmatch.filter(filePattern, {
                    matchBase: true
                }));
                this.log('Checking context', {
                    color: 'yellow'
                });
                
                var uploadPromise = (awsDeploymentOptions.revision.revisionType === 'S3') ? this._awsS3Client.upload(filesToUpload, this.readConfig('s3UploadOptions'), this.readConfig('manifestPath')) : new Promise().resolve();
                return uploadPromise.then((result) => {
                    return this._awsCodeDeployClient.createDeployment(result)
                });
            }
        });
        return new DeployPlugin();
    }
};
