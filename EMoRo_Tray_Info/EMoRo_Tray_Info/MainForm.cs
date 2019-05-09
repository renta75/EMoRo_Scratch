using SocketIOClient;
using SocketIOClient.Messages;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Diagnostics;
using System.IO.Ports;
using EMoRo_Tray_Info.Properties;

namespace EMoRo_Tray_Info
{
    public partial class MainForm : Form
    {
        static Process process;
        static bool _bluetoothIsOn=false;
        static bool _serialIsOn=false;

        public MainForm()
        {
            InitializeComponent();
            

            Task.Delay(1000).Wait();
            this.Visible = false;
            RefreshPorts();

            foreach (object item in comboBoxPorts.Items)
            {
                if (((String)item) == Settings.Default.PortName)
                {
                    comboBoxPorts.SelectedItem = item;
                }
            }

            



        }

        static void StartPipeClient()
        {
            Task.Factory.StartNew(() =>
            {
                var client = new NamedPipeClientStream("EMoRoPipe");
                client.Connect();
                StreamReader reader = new StreamReader(client);
                StreamWriter writer = new StreamWriter(client);
                while (true)
                {
                    try
                    {
                        writer.WriteLine("query bluetooth");
                        writer.Flush();
                        var line1 = reader.ReadLine();
                        _bluetoothIsOn = line1.Contains("bluetooth open");

                        writer.WriteLine("query serial");
                        writer.Flush();
                        var line2 = reader.ReadLine();
                        _serialIsOn = line2.Contains("serial open");
                    }
                    catch (Exception exc)
                    {
                        _serialIsOn = false;
                        _bluetoothIsOn = false;
                        break;
                    }

                }
            });
        }

        static void StartProcess(String portName) {

            Task.Factory.StartNew(() =>
            {
                try
                {
                    if (process != null)
                    {
                        process.Kill();
                        process = null;
                    }

                    process = new Process();
                    process.StartInfo.FileName = "EMoRoSErver.exe";
                    process.StartInfo.Arguments = "portName="+portName;
                    process.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
                    process.Start();
                    StartPipeClient();
                    process.WaitForExit();
                }
                catch (Exception exc)
                {

                }
            });
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            String info=String.Empty;

            if (_serialIsOn)
            {
                pictureBoxSerial.BackColor = Color.Green;
                info = "Serial ON ";
            }
            else
            {
                pictureBoxSerial.BackColor = Color.Red;
                info = "Serial OFF ";
            }


            if (_bluetoothIsOn)
            {
                pictureBoxBluetooth.BackColor = Color.Green;
                info += "+ Bluetooth ON";
            }
            else
            {
                pictureBoxBluetooth.BackColor = Color.Red;
                info += "+ Bluetooth OFF";
            }

            notifyIcon1.Text = info;
            if (_bluetoothIsOn)
                notifyIcon1.Icon = EMoRo_Tray_Info.Properties.Resources.blue;
            else if (_serialIsOn)
                notifyIcon1.Icon = EMoRo_Tray_Info.Properties.Resources.green;
            else
                notifyIcon1.Icon = EMoRo_Tray_Info.Properties.Resources.red;

            if (process == null)
            {
                btnStart.Enabled = true;
                btnStop.Enabled = false;
            }
            else
            {
                btnStart.Enabled = false;
                btnStop.Enabled = true;
            }
        }

        private void notifyIcon1_MouseDoubleClick(object sender, MouseEventArgs e)
        {
            this.Visible = true;
        }

        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            e.Cancel = true;
            this.Visible = false;
        }

        private void tsmiExit_Click(object sender, EventArgs e)
        {
            Settings.Default.PortName = (String) comboBoxPorts.SelectedItem;
            Settings.Default.Save();
            if (process != null)
            {
                process.Kill();
                process = null;
            }

            System.Environment.Exit(1);
        }

        private void comboBoxPorts_SelectedIndexChanged(object sender, EventArgs e)
        {
            StartProcess((String)comboBoxPorts.Items[comboBoxPorts.SelectedIndex]);
            
        }

        private void btnStop_Click(object sender, EventArgs e)
        {
            try
            {
                if (process != null)
                {
                    process.Kill();
                    process = null;
                }
            }
            catch (Exception exc)
            {
                process = null;
            }
        }

        private void btnStart_Click(object sender, EventArgs e)
        {
            StartProcess((String)comboBoxPorts.Items[comboBoxPorts.SelectedIndex]);
        }

        private void btnRefresh_Click(object sender, EventArgs e)
        {
            try
            {
                if (process != null)
                {
                    process.Kill();
                    process = null;
                }
            }
            catch (Exception exc)
            {
                process = null;
            }
            finally
            {
                RefreshPorts();
            }
        }

        private void RefreshPorts()
        {
            comboBoxPorts.Items.Clear();
            foreach (String port in SerialPort.GetPortNames())
            {
                comboBoxPorts.Items.Insert(0, port);
            }
            comboBoxPorts.SelectedIndex = 0;
        }
    }
}
