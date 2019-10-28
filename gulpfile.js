const browserSync = require('browser-sync').create();
const cleanCss = require('gulp-clean-css');
const concat = require('gulp-concat');
const del = require('del');
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const loadPlugin = require('gulp-load-plugins')();
const pug = require('gulp-pug');
const sassGlob = require('gulp-sass-glob');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const yargs = require('yargs');

const config = {
    distPath: './dist',
    externalStyles: [
        './node_modules/normalize.css/normalize.css',
    ],
    sourcePath: './source',
}

const webpackConfig = require('./webpack.config.js');
const argv = yargs.argv;
const production = !!argv.production;

const setMode = (env = production) => {
    webpackConfig.mode = env ? 'production' : 'development';
    webpackConfig.devtool = env ? false : 'source-map';
    webpackConfig.optimization = {
        minimize: env,
    };
}

gulp.task('clean', callback => del(config.distPath, callback));

gulp.task('files', () => {
    return gulp.src(`${config.sourcePath}/assets/files/**/*.*`)
        .pipe(gulp.dest(`${config.distPath}/assets/files`));
});

gulp.task('fonts', () => {
    return gulp.src(`${config.sourcePath}/assets/fonts/**/*.*`)
        .pipe(gulp.dest(`${config.distPath}/assets/fonts`));
});

gulp.task('images', () => {
    return gulp.src(
        `${config.sourcePath}/assets/images/**/*.*`,
        { since: gulp.lastRun('images') },
    )
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.jpegtran({ progressive: true} ),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false },
                ],
            }),
        ]))
        .pipe(gulp.dest(`${config.distPath}/assets/images`))
});

gulp.task('svgSprite', () => {
    return gulp.src(`${config.sourcePath}/assets/svg/**/*.svg`)
        .pipe(loadPlugin.svgmin({
            js2svg: {
                pretty: true,
            },
        }))
        .pipe(loadPlugin.cheerio({
            run: ($) => {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: true },
        }))
        .pipe(loadPlugin.replace('&gt;', '>'))
        .pipe(loadPlugin.svgSprite({
            mode: {
                symbol: {
                    sprite: "../sprite.svg",
                },
            },
        }))
        .pipe(gulp.dest(`${config.distPath}/assets/images`))
});

gulp.task('externalStyles', () => {
    return gulp.src(config.externalStyles)
        .pipe(cleanCss({ compatibility: 'ie8' }))
        .pipe(concat('external.css'))
        .pipe(gulp.dest(`${config.distPath}/css`))
});

gulp.task('styles', () => {
    return gulp.src(`${config.sourcePath}/styles/bundle.scss`)
        .pipe(loadPlugin.sourcemaps.init())
        .pipe(sassGlob())
        .pipe(loadPlugin.sass())
            .on('error', loadPlugin.notify.onError((error) => {
                return { 
                    title: 'Styles',
                    message: error.message,
                }
            }))
        .pipe(loadPlugin.autoprefixer({ cascade: false }))
        .pipe(cleanCss({ compatibility: 'ie8' }))
        .pipe(loadPlugin.sourcemaps.write())
        .pipe(gulp.dest(`${config.distPath}/css`))
        .pipe(browserSync.stream());
});

gulp.task('pug', () => {
    const content = require('./source/json/content.json');

    return gulp.src(`${config.sourcePath}/templates/pages/*.pug`)
        .pipe(pug({
            locals: content,
            pretty: true,
        }))
        .on('error', loadPlugin.notify.onError((error) => {
            return {
                title: 'Pug',
                message: error.message,
            }
        }))
        .pipe(gulp.dest(config.distPath));
});

gulp.task('js', () => {
    return gulp.src(`${config.sourcePath}/js/**/*.js`)
        .pipe(webpackStream(webpackConfig), webpack)
        .pipe(gulp.dest(`${config.distPath}/js`))
        .on('end', browserSync.reload);
});

gulp.task('eslint', () => {
    return gulp.src(`${config.sourcePath}/js/**/*.js`)
        .pipe(loadPlugin.eslint())
        .pipe(loadPlugin.eslint.format());
});

gulp.task('scripts:serve', gulp.series(
    callback => {
        setMode();
        callback();
    },
    'eslint',
    'js',
));

gulp.task('scripts', gulp.series(
    callback => {
        setMode(true);
        callback();
    },
    'eslint',
    'js'),
);

gulp.task('watch', () => {
    gulp.watch(`${config.sourcePath}/assets/images/**/*.*`, gulp.series('images'));
    gulp.watch(`${config.sourcePath}/assets/svg/**/*.svg`, gulp.series('svgSprite'));
    gulp.watch(`${config.sourcePath}/templates/**/*.pug`, gulp.series('pug'));
    gulp.watch(`${config.sourcePath}/styles/**/*.scss`, gulp.series('styles'));
    gulp.watch(`${config.sourcePath}/js/**/*.js`, gulp.series('scripts:serve'));
});

gulp.task('serve', () => {
    browserSync.init({
        open: true,
        server: config.distPath,
    });

    browserSync.watch([`${config.distPath}/**/*.*`, '!**/*.css'], browserSync.reload);
});

gulp.task('addVersions', () => {
    return gulp.src(`${config.distPath}/*.html`)
        .pipe(loadPlugin.replace(new RegExp('.js"', 'g'), '.js?v=' + new Date().getTime() + '"'))
        .pipe(loadPlugin.replace(new RegExp('.css"', 'g'), '.css?v=' + new Date().getTime() + '"'))
        .pipe(gulp.dest(config.distPath));
})

gulp.task('development', gulp.series('clean',
    gulp.parallel(
        'fonts',
        'files',
        'images',
        'svgSprite',
        'externalStyles',
        'pug',
        'styles',
        'scripts:serve',
    ),
    gulp.parallel(
        'watch',
        'serve',
    ),
));

gulp.task('build', gulp.series('clean',
    gulp.parallel(
        'fonts',
        'files',
        'images',
        'svgSprite',
        'externalStyles',
        'pug',
        'styles',
        'scripts',
    ),
    gulp.series('addVersions'),
));

gulp.task('default', gulp.series('development'));
