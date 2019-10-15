const cleanCss = require('gulp-clean-css');
const concat = require('gulp-concat');
const del = require('del');
const gulp = require('gulp');
const loadPlugin = require('gulp-load-plugins')();
const pug = require('gulp-pug');
const sassGlob = require('gulp-sass-glob');

const config = {
    distPath: './dist',
    externalStyles: [
        './node_modules/normalize.css/normalize.css',
    ],
    sourcePath: './source',
}

gulp.task('clean', (callback) => {
    return del(config.distPath, callback);
});

gulp.task('fonts', () => {
    gulp.src(`${config.sourcePath}/assets/fonts/**/*.*`)
        .pipe(gulp.dest(config.distPath));
});

gulp.task('images', () => {
    return gulp.src(
        `${config.sourcePath}/assets/images/**/*.*`,
        { since: gulp.lastRun('images') },
    )
        .pipe(gulp.dest(`${config.distPath}/assets/images`))
        // Todo: imagemin прикрутить
});

gulp.task('svgSprite', () => {
    return gulp.src(`${config.sourcePath}/assets/svg/*.svg`)
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
});

gulp.task('pug', () => {
    return gulp.src(`${config.sourcePath}/templates/pages/*.pug`)
        .pipe(pug({
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