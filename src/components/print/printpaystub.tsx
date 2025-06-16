const onPrint = async () => {
  const printWindow = window.open('')
    if (printWindow) {
      printWindow.document.write('<html><head><title></title><style type="text/css">')
      printWindow.document.write(
        '* { font-family: SegoeUI-Regular-final, "Segoe UI", Segoe, Tahoma, Helvetica, Arial, Sans-Serif; }'
      )
      printWindow.document.write('table, th, td { border: 1px solid black; border-collapse: collapse;}')
      printWindow.document.write('th, td { max-width: 500px; overflow-wrap: break-word; padding: 2px 5px 2px 5px;}')
      printWindow.document.write('li { list-style-type: none; }')
      printWindow.document.write('</style></head><body>')
      // printWindow.document.write(`<h2>${fmtMsg(strings.GridAriaLabel)}</h2>`)
  
        printWindow.document.write('<table>')
        printWindow.document.write('<tr>')
        // printWindow.document.write(`<th>${fmtMsg(recordAddStrings.service)}</th>`)
        // printWindow.document.write(`<th>${fmtMsg(recordAddStrings.type)}</th>`)
        // printWindow.document.write(`<th>${fmtMsg(recordAddStrings.hostName)}</th>`)
        // printWindow.document.write(`<th>${fmtMsg(recordAddStrings.pointToAddressValue)}</th>`)
        // printWindow.document.write(`<th>${fmtMsg(recordAddStrings.priority)}</th>`)
        // printWindow.document.write(`<th>${fmtMsg(recordAddStrings.ttl)}</th>`)
        printWindow.document.write('</tr>')
        printWindow.document.write('</table>')
      printWindow.document.write('<br/>')
      printWindow.document.write('</body></html>')
      // if you want to change this implementation, make sure you verified on Chrome, Firefox, IE and Edge
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  export default onPrint;
