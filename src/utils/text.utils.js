const arrayToHumanizedList = textArray => {
  switch (textArray.length) {
    case 0:
    case 1:
      return textArray.toString()
    case 2:
      return textArray.join(' and ')
    default:
      return `${textArray.slice(0, -1).join(', ')}, and ${textArray[textArray.length - 1]}`
  }
}


const capitalize = (word, firstLetter = true) => {
  return (firstLetter ? word.charAt(0).toUpperCase() : word.charAt(0)) + word.slice(1).replace(/(\_\w)/g, match => match[1].toUpperCase())
}


const pluralize = (item, count, pluralOverride = null) => { // Assumes zero should be plural (e.g., '0 clients')
  if (count === 1)
    return item

  if (pluralOverride)
    return pluralOverride

  return `${item}s`
}

const randomElement = inputArray => {
  let length = inputArray.length
  switch (length) {
    case 0:
      return
    case 1:
      return inputArray[0]
    default:
      return inputArray[Math.floor(Math.random() * inputArray.length)]
  }
}

module.exports = {
  arrayToHumanizedList,
  pluralize,
  randomElement,
  capitalize
}