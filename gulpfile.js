// // v1.0.0

console.log(`${process.argv}`);
// //是否使用IDE自带的node环境和插件，设置false后，则使用自己环境(使用命令行方式执行)
// let useIDENode = process.argv[0].indexOf("LayaAir") > -1 ? true : false;
// //获取Node插件和工作路径
// let ideModuleDir = useIDENode ? process.argv[1].replace("gulp\\bin\\gulp.js", "").replace("gulp/bin/gulp.js", "") : "";
let workSpaceDir = "./";

//引用插件模块
let gulp = require("gulp");
let browserify = require("browserify");
let source = require("vinyl-source-stream");
let tsify = require("tsify");
let watchify = require("watchify");
let gutil = require("gulp-util");
let browserSync = require("browser-sync").create();
let runSequence = require("run-sequence");
let babelify = require("babelify");
let realpathify = require("realpathify");

const DEBUG = true;

if (watchify) {
    const watchedBrowserify = watchify(
        browserify({
            basedir: workSpaceDir,
            //是否开启调试，开启后会生成jsmap，方便调试ts源码，但会影响编译速度
            debug: DEBUG,
            entries: ["src/app.ts"],
            cache: {},
            packageCache: {}
        })
            .plugin(tsify, { target: "es5" })
            .plugin(realpathify)
            .transform(babelify.configure({ extensions: [".ts", ".js"] }))
    );

    // 记录watchify编译ts的时候是否出错，出错则不刷新浏览器
    let isBuildError = false;
    gulp.task("build", () => {
        return watchedBrowserify
            .bundle()
            .on("error", (...args) => {
                isBuildError = true;
                gutil.log(...args);
            })
            .pipe(source("bundle.js"))
            .pipe(gulp.dest(workSpaceDir + "/dist/"));
    });

    gulp.task("watch", ["build"], () => {
        // 浏览器开发时自动刷新页面
        browserSync.init({
            port: 3002,
            server: {
                watchFiles: ["./dist/", "index.html"],
                baseDir: "./"
            }
        });
        //  watchify监听文件刷新
        watchedBrowserify.on("update", () => {
            isBuildError = false;
            runSequence("build", () => {
                if (!isBuildError) {
                    // 没有编译错误时，刷新浏览器界面
                    browserSync.reload();
                }
            });
        });
        // 打印watchify编译日志
        watchedBrowserify.on("log", gutil.log);
    });
}
