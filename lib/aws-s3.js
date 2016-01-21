'use strict';
var CoreObject = require('core-object');
var fs = require('fs');
var path = require('path');
var AWS = require('aws-sdk');
var archiver = require('archiver');
var Promise = require('ember-cli/lib/ext/promise');
var _ = require('lodash');
var mime = require('mime');
var EXPIRE_IN_2030 = new Date('2030');
var TWO_YEAR_CACHE_PERIOD_IN_SEC = 60 * 60 * 24 * 365 * 2;
var mkdirp = require('mkdirp');

module.exports = CoreObject.extend({
    init: function(options) {

        this.awsS3Client = new AWS.S3(options.awsS3ServiceOptions);
        this.manifestPath = options.manifestPath;
        this.parent = options.parentPlugin;
        this.archiveType = options.archiveType;
        this.archiveTempDirectory = options.archiveTempDirectory;
        this.revisionKey = options.revisionKey;





    },
    upload: function(distFiles, s3PutObjectOptions) {


        return this.getFilesForUpload(distFiles)
            .then(this.createArchiveForFiles.bind(this))
            .then((result) => {
                return this.uploadArchive(result, s3PutObjectOptions)
            });
    },
    getFilesForUpload: function(distFiles) {

        var parent = this.parent;
        var filePaths = distFiles || [];
        if (typeof filePaths === 'string') {
            filePaths = [filePaths];
        }


        var folderKey = this.s3FolderKey;
        var manifestPath = this.manifestPath;
        if (manifestPath) {
            var key = folderKey === '' ? manifestPath : [folderKey, manifestPath].join('/');
            parent.log('Downloading manifest for differential deploy from `' + key + '`...');
            return new Promise(function(resolve, reject) {
                var params = {
                    Bucket: pluginOptions.bucket,
                    Key: key
                };
                this.awsS3Client.getObject(params, function(error, data) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data.Body.toString().split('\n'));
                    }
                }.bind(this));
            }.bind(this)).then(function(manifestEntries) {
                parent.log("Manifest found. Differential deploy will be applied.", {
                    verbose: true
                });
                return this.difference(filePaths, manifestEntries);
            }).catch(function( /*reason*/ ) {
                parent.log("Manifest not found. Disabling differential deploy.", {
                    color: 'yellow',
                    verbose: true
                });
                return Promise.resolve(filePaths);
            });
        } else {
            return Promise.resolve(filePaths);
        }
    },
    createArchiveForFiles: function(filePaths) {
        var parent = this.parent;
        var archive = archiver.create(this.archiveType);
        //check and create archive directory
        mkdirp.sync(this.archiveTempDirectory);
        var archiveFilePath = path.join(this.archiveTempDirectory, this.revisionKey + '.' + this.archiveType);
        var outputFile = fs.createWriteStream(archiveFilePath);
        return new Promise(function(resolve, reject) {
            outputFile.on('close', function() {
                resolve(archiveFilePath);
            });
            outputFile.on('error', function(error) {
                reject(error);
            });
            archive.pipe(outputFile);
            for (var filePath of filePaths) {
                archive.append(fs.createReadStream(path.join(this.distDir, filePath)), {
                    name: filePath
                })
            }
            archive.finalize();
        }.bind(this));
    },
    uploadArchive: function(codeDeployArchive, s3PutObjectOptions) {
        var parent = this.parent;
        var data = fs.readFileSync(codeDeployArchive);
        var contentType = mime.lookup(codeDeployArchive);
        var encoding = mime.charsets.lookup(contentType);
        var cacheControl = 'max-age=' + TWO_YEAR_CACHE_PERIOD_IN_SEC + ', public';
        var expires = EXPIRE_IN_2030;
        if (encoding) {
            contentType += '; charset=';
            contentType += encoding.toLowerCase();
        }
        if (this.manifestPath) {
            parent.log('uploading manifest', {
                verbose: true
            });
        }

        s3PutObjectOptions.Body = data;
        if (!s3PutObjectOptions.CacheControl)
            s3PutObjectOptions.CacheControl = cacheControl;
        if (!s3PutObjectOptions.Expires)
            s3PutObjectOptions.Expires = expires;
        if (!s3PutObjectOptions.ContentType)
            s3PutObjectOptions.ContentType = contentType;
        if ((!s3PutObjectOptions.Key) || (s3PutObjectOptions.Key.trim() === ''))
            s3PutObjectOptions.Key = path.basename(codeDeployArchive);
        return new Promise(function(resolve, reject) {
            //Need to upload manifest file as well.
            this.awsS3Client.putObject(s3PutObjectOptions, function(error, data) {
                if (error) {
                    parent.log(error);
                    reject(error);
                } else {
                    parent.log(data);
                    resolve({
                        bucket: s3PutObjectOptions.Bucket,
                        archiveType: this.archiveType,
                        eTag: data.ETag,
                        key: codeDeployArchive,
                        versionId: data.VersionId || undefined
                    });
                }
            }.bind(this));
        }.bind(this));
    }
});
