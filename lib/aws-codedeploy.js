/* jshint node: true */
'use strict';
var CoreObject = require('core-object');
var util = require('util');
var Promise = require('ember-cli/lib/ext/promise');
module.exports = CoreObject.extend({
    init: function(options) {
        var AWS = require('aws-sdk');

        this.codeDeploy = new AWS.CodeDeploy(options.awsCodeDeployServiceOptions);
        this.awsDeploymentOptions = options.awsDeploymentOptions;
    },
    createDeployment: function(s3FileUploadOptions) {
        return new Promise(function(resolve, reject) {
            var awsDeploymentOptions = this.awsDeploymentOptions;

            if (this.awsDeploymentOptions.revision.revisionType === 'S3') {
                this.awsDeploymentOptions.revision.s3Location = {
                    bucket: s3FileUploadOptions.bucket,
                    bundleType: s3FileUploadOptions.archiveType,
                    eTag: s3FileUploadOptions.eTag,
                    key: s3FileUploadOptions.key,
                    version: s3FileUploadOptions.versionId,
                }
                this.awsDeploymentOptions.revision.gitHubLocation = undefined;
            } else
                this.awsDeploymentOptions.revision.s3Location = undefined;

            this.codeDeploy.createDeployment(this.awsDeploymentOptions, function(error, data) {
                if (error)
                    reject(error); // an error occurred
                else resolve({
                    awsDeploymentId: data.deploymentId
                }); // successful response. Return deployment Id
            }.bind(this));
        }.bind(this));
    }
});
