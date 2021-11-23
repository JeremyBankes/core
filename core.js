const crypto = require('crypto');

const core = {

    // Tools for manipulating data
    data: {

        /**
         * @typedef {'string'|'number'|'boolean'|'date'|'object'} ParsableType
         */

        /**
         * Retrieves a value from an object as a certain type, or returns a fallback value.
         * @param {object} source
         * @param {string} field Can specify a path to a field seperated by dots (ie person.name.first)
         * @param {ParsableType} type
         * @param {any} [fallback] Leave unspecified for required fields
         */
        get(source, field, type, fallback) {
            const path = field.split('.').reverse();
            const search = (object, path) => {
                const key = path.pop();
                if (!key || !(key in object)) return undefined;
                const value = object[key];
                if (path.length === 0) return value;
                return search(value, path);
            };
            const value = core.data.treatAs(search(source, path), type);
            if (value === null) {
                if (fallback === undefined) throw new Error(`Missing required ${type} field "${field}".`);
                return fallback;
            }
            return value;
        },

        /**
         * Attempts to treat 'value' as 'type'
         * @param {any} value 
         * @param {ParsableType} type 
         * @returns 'value' as 'type' data type, null otherwise.
         */
        treatAs(value, type) {
            if (value === null || value === undefined) return null;
            switch (type) {
                case 'string':
                    return String(value);
                case 'number':
                    value = parseFloat(value);
                    if (isNaN(value)) return null;
                    return value;
                case 'boolean':
                    return Boolean(value);
                case 'date':
                    value = core.time.parse(value);
                    if (isNaN(value)) return null;
                    return value;
                case 'array':
                    if (!(Symbol.iterator in Object(value))) return null;
                    return [...value];
                case 'object':
                    return value;
                default:
                    throw new Error(`Invalid type "${type}".`);
            }
        }

    },

    // Tools for generating random values
    random: {

        /**
         * Generates a random hexidecimal number 'size' characters long
         * @param {number} [size] Defaults to 16
         * @returns 
         */
        token(size = 16) {
            return crypto.randomBytes(Math.round(size / 2)).toString('hex');
        }

    },

    // Tools for manipulating strings of text
    text: {

        /**
         * @param {number} number 
         * @returns 
         */
        getNumberSuffix(number) {
            number %= 10;
            if (number === 1) return 'st';
            if (number === 2) return 'nd';
            if (number === 3) return 'rd';
            return 'th';
        },

        /**
         * Pluralizes 'word'
         * @param {string} word 
         * @param {number} count 
         */
        pluralize(word, count) {
            if (count > 0) {
                if (word.endsWith('s')) return word + 'es';
                return word + 's';
            }
            return word;
        },

        /**
         * Converts text into a slug string
         * 
         * I.E.
         * 
         * "Jeremy's Friend Was Here" -> "jeremys-friend-was-here"
         * 
         * @param {string} text 
         * @returns A safe slug string
         */
        toSlug(text) {
            return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/ +/g, '-');
        }

    },

    // Tools for working with dates
    time: {

        SHORT_DAY_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        LONG_DAY_NAMES: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        SHORT_MONTH_NAMES: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        LONG_MONTH_NAMES: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

        /**
         * @param {Date} date 
         * @returns UTC values object
         */
        utc(date = new Date()) {
            return {
                year: date.getUTCFullYear(),
                month: date.getUTCMonth(),
                date: date.getUTCDate(),
                day: date.getUTCDay(),
                hours: date.getUTCHours(),
                minute: date.getUTCMinutes(),
                seconds: date.getUTCSeconds(),
                milliseconds: date.getUTCMilliseconds()
            };
        },

        /**
         * Attemps to create a Date object from 'value'
         * @param {string} value A string with ordered date values (year, month, date, hours, minutes, seconds, ms) (Any delimiter)
         * @param {string} [timeZone] Defaults to UTC
         * @returns 
         */
        parse(value, timeZone) {
            const values = value.match(/[0-9]+/g).map(item => parseInt(item));
            if (values.length > 1) values[1]--;
            const unixTimestamp = Date.UTC(...values);
            const offset = this.getTimeZoneOffset(timeZone, new Date(unixTimestamp));
            return new Date(unixTimestamp - offset);
        },

        /**
         * Gets the name of the day of the week for 'date'
         * @param {Date} date 
         * @param {boolean} long True for long day name, false for short (ie 'Sunday' vs 'Sun')
         */
        getDay(date, long) {
            return long ? core.time.LONG_DAY_NAMES[date.getDay()] : core.time.SHORT_DAY_NAMES[date.getDay()];
        },

        /**
         * Gets the name of the month for 'date'
         * @param {Date} date 
         * @param {boolean} long True for long month name, false for short (ie 'March' vs 'Mar')
         */
        getMonth(date, long) {
            return long ? core.time.LONG_MONTH_NAMES[date.getMonth()] : core.time.SHORT_MONTH_NAMES[date.getMonth()];
        },

        /**
         * @param {string} [timeZone] A time zone (https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). Defaults to system time zone.
         * @param {Date} [date] When to determine the offset at, important for daylight saving times. Defaults to now.
         * @returns The number of milliseconds to add to UTC time to get to 'timeZone'
         */
        getTimeZoneOffset(timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone, date = new Date()) {
            const format = new Intl.DateTimeFormat([], { hour: 'numeric', hourCycle: 'h23', timeZone });
            const hours = parseInt(format.formatToParts(date).find(part => part.type === 'hour').value);
            let hoursOffset = hours - date.getUTCHours();
            while (hoursOffset < -12) hoursOffset += 24;
            while (hoursOffset > 12) hoursOffset -= 24;
            return hoursOffset * 60 * 60 * 1000;
        },

        /**
         * Converts a date to string
         * @param {Date} date
         * @param {boolean} long True for long date (full names and number suffixes), false otherwise
         * @param {boolean} includeDay
         * @param {boolean} includeYear 
         */
        toString(date, long = false, includeDay = true, includeYear = true) {
            const year = date.getFullYear();
            const day = core.time.getDay(date, long);
            const month = core.time.getMonth(date, long);
            const dateOfMonth = long ? `${date.getDate()}${core.text.getNumberSuffix(date.getDate())}` : date.getDate();
            if (includeDay && includeYear) return `${day}, ${month} ${dateOfMonth}, ${year}`;
            if (includeDay && !includeYear) return `${day}, ${month} ${dateOfMonth}`;
            if (!includeDay && includeYear) return `${month} ${dateOfMonth}, ${year}`;
            if (!includeDay && !includeYear) return `${month} ${dateOfMonth}`;
        },

        /**
         * Returns a human readable duration string for the given amount of milliseconds
         * @param {number} milliseconds 
         * @param {boolean} long 
         */
        toDurationString(milliseconds, long = true) {
            const SECOND = 1000;
            const MINUTE = SECOND * 60;
            const HOUR = MINUTE * 60;
            const DAY = HOUR * 24;
            let days = 0;
            let hours = 0;
            let minutes = 0;
            let seconds = 0;
            while (milliseconds >= DAY) { milliseconds -= DAY; days++; }
            while (milliseconds >= HOUR) { milliseconds -= HOUR; hours++; }
            while (milliseconds >= MINUTE) { milliseconds -= MINUTE; minutes++; }
            while (milliseconds >= SECOND) { milliseconds -= SECOND; seconds++; }
            seconds += Math.round(milliseconds / SECOND);
            const pieces = [];
            if (days > 0) pieces.push(`${days} ${long ? core.text.pluralize('day', days) : 'd'}`);
            if (hours > 0) pieces.push(`${hours} ${long ? core.text.pluralize('hour', hours) : 'h'}`);
            if (minutes > 0) pieces.push(`${minutes} ${long ? core.text.pluralize('minute', minutes) : 'm'}`);
            if (seconds > 0) pieces.push(`${seconds} ${long ? core.text.pluralize('second', seconds) : 's'}`);
            if (pieces.length === 0) pieces.push('less than a second');
            return pieces.join(', ');
        },

        /**
         * Converts a date to an ISO string
         * @param {Date} date 
         * @param {boolean} includeTime 
         */
        toISOString(date, includeTime = false) {
            let string = date.toISOString();
            if (!includeTime) string = string.substring(0, 10);
            return string;
        }

    },

    error: {

        /**
         * An error to represent an error that occured because of invalid client input
         */
        UserError: class extends Error {
            constructor(...parameters) { super(...parameters); }
        }

    }

};

module.exports = core;